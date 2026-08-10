-- ============================================================
-- GBSInventario · Esquema UNIFICADO (BD fundacional)
-- ------------------------------------------------------------
-- Esta base la "arranca" el inventario: aquí se cuentan los
-- items reales. Después acopio usa esta misma BD y se conectan
-- las comandas (que restarán vía movimientos de salida). Todo
-- queda interconectado sobre este esquema normalizado.
--
-- Orden de ejecución:
--   1) supabase-setup.sql   (este archivo — estructura)
--   2) supabase/products-seed.sql  (carga los 1674 insumos)
--
-- Modelo:
--   products   → insumo normalizado (name + unidad), umbral, client_id
--   inventory  → cantidad actual (qnty). NO se escribe a mano:
--                la mantiene un trigger a partir de movements.
--   movements/movement_items → entradas ('in', suman) y salidas
--                ('out', restan). Contar = registrar una entrada.
--   apply_count() → RPC idempotente: registra un conteo como
--                movimiento (header + item) en una transacción.
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM (
    'alimentos_no_perecederos','alimentos','higiene_personal','snacks',
    'alimentos_bebe','limpieza','panales_higiene_ninos','hidratacion',
    'veterinaria','herramientas','ropa_descanso','medicina','papeleria'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE movement_direction AS ENUM ('in','out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('open','fulfilled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Catálogo ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT          NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 200),
  unidad      TEXT          NOT NULL DEFAULT 'und',
  type        product_type  NOT NULL,
  umbral      INTEGER       NOT NULL DEFAULT 10 CHECK (umbral >= 0),
  client_id   TEXT          NOT NULL UNIQUE,          -- id estable del cliente (offline / mapeo con acopio)
  metadata    JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (name, unidad)
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id  BIGINT   PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  qnty        INTEGER  NOT NULL DEFAULT 0 CHECK (qnty >= 0)
);

-- ── Personas / login (para acopio y comandas más adelante) ─
CREATE TABLE IF NOT EXISTS phones (
  company_code TEXT NOT NULL CHECK (company_code ~ '^(0412|0414|0416|0422|0424|0426|02[0-9]{2})$'),
  number       TEXT NOT NULL CHECK (number ~ '^[0-9]{7}$'),
  PRIMARY KEY (company_code, number)
);

CREATE TABLE IF NOT EXISTS persons (
  ci                  BIGINT       PRIMARY KEY CHECK (ci > 0),
  name                TEXT         NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 200),
  surname             TEXT         NOT NULL CHECK (char_length(trim(surname)) > 0 AND char_length(surname) <= 200),
  phone_company_code  TEXT         NOT NULL,
  phone_number        TEXT         NOT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  FOREIGN KEY (phone_company_code, phone_number) REFERENCES phones (company_code, number)
);

-- Coordinadores (login vía Supabase Auth). Ver README.
CREATE TABLE IF NOT EXISTS user_profiles (
  id      UUID  PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre  TEXT  NOT NULL CHECK (char_length(trim(nombre)) > 0)
);

-- ── Movimientos (entradas / salidas de stock) ──────────────
CREATE TABLE IF NOT EXISTS movements (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  direction     movement_direction  NOT NULL DEFAULT 'in',
  destination   TEXT                CHECK (destination IS NULL OR char_length(destination) <= 200),
  approved_by   BIGINT              REFERENCES persons (ci) ON DELETE SET NULL,
  delivered_by  BIGINT              REFERENCES persons (ci) ON DELETE SET NULL,
  note          TEXT                CHECK (note IS NULL OR char_length(note) <= 2000),  -- para conteos: nombre de quien contó
  client_op_id  TEXT                UNIQUE,     -- id de operación del cliente (idempotencia)
  occurred_at   TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movement_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  movement_id  BIGINT   NOT NULL REFERENCES movements (id) ON DELETE CASCADE,
  product_id   BIGINT   NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  qnty         INTEGER  NOT NULL CHECK (qnty > 0)
);

CREATE TABLE IF NOT EXISTS requests (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id        BIGINT          NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  requester_id      BIGINT          REFERENCES persons (ci) ON DELETE SET NULL,
  qnty              INTEGER         NOT NULL CHECK (qnty > 0),
  qnty_outstanding  INTEGER         NOT NULL CHECK (qnty_outstanding >= 0),
  status            request_status  NOT NULL DEFAULT 'open',
  requested_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  note              TEXT            CHECK (note IS NULL OR char_length(note) <= 2000)
);

-- ── Respaldos + comunicados (compartidos con acopio) ───────
CREATE TABLE IF NOT EXISTS checkpoints (
  id          TEXT PRIMARY KEY,
  creado_por  TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comms (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL CHECK (char_length(trim(titulo)) > 0),
  urgencia    TEXT NOT NULL DEFAULT 'info' CHECK (urgencia IN ('info','urgente','critico')),
  cuerpo      TEXT NOT NULL CHECK (char_length(trim(cuerpo)) > 0),
  autor       TEXT NOT NULL DEFAULT 'Anónimo',
  activo      BOOLEAN NOT NULL DEFAULT true,
  fecha       BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCIONES / TRIGGERS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Cada producto nuevo arranca con inventory(qnty=0)
CREATE OR REPLACE FUNCTION create_inventory_row() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id) VALUES (NEW.id)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_create_inventory ON products;
CREATE TRIGGER trg_products_create_inventory AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION create_inventory_row();

-- Todo movimiento debe tener al menos un item (diferido al commit)
CREATE OR REPLACE FUNCTION movement_has_items() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM movement_items WHERE movement_id = NEW.id) THEN
    RAISE EXCEPTION 'El movimiento % debe tener al menos un item', NEW.id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movement_has_items ON movements;
CREATE CONSTRAINT TRIGGER trg_movement_has_items AFTER INSERT ON movements
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION movement_has_items();

-- Aplica cada item al stock según la dirección del movimiento
CREATE OR REPLACE FUNCTION apply_movement_item() RETURNS TRIGGER AS $$
DECLARE dir movement_direction;
BEGIN
  SELECT direction INTO dir FROM movements WHERE id = NEW.movement_id;
  IF dir = 'in' THEN
    UPDATE inventory SET qnty = qnty + NEW.qnty WHERE product_id = NEW.product_id;
  ELSE
    UPDATE inventory SET qnty = qnty - NEW.qnty WHERE product_id = NEW.product_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movement_items_apply ON movement_items;
CREATE TRIGGER trg_movement_items_apply AFTER INSERT ON movement_items
  FOR EACH ROW EXECUTE FUNCTION apply_movement_item();

-- ── RPC: registrar un conteo como movimiento (idempotente) ─
-- La app llama a /rest/v1/rpc/apply_count. delta>0 = entrada,
-- delta<0 = salida (corrección). client_op_id evita doble conteo
-- si se reintenta. Devuelve la cantidad final del insumo.
CREATE OR REPLACE FUNCTION apply_count(
  p_client_op_id       TEXT,
  p_product_client_id  TEXT,
  p_delta              INTEGER,
  p_counted_by         TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid BIGINT; v_mid BIGINT; v_qty INTEGER;
BEGIN
  SELECT id INTO v_pid FROM products WHERE client_id = p_product_client_id;
  IF v_pid IS NULL THEN RAISE EXCEPTION 'Producto % no existe', p_product_client_id; END IF;

  -- idempotencia: si ya se aplicó esta operación, devolver el stock actual
  IF EXISTS (SELECT 1 FROM movements WHERE client_op_id = p_client_op_id) THEN
    SELECT qnty INTO v_qty FROM inventory WHERE product_id = v_pid;
    RETURN v_qty;
  END IF;

  INSERT INTO movements (direction, note, client_op_id)
    VALUES (
      CASE WHEN p_delta >= 0 THEN 'in'::movement_direction ELSE 'out'::movement_direction END, 
      p_counted_by, 
      p_client_op_id
    ) RETURNING id INTO v_mid;

  INSERT INTO movement_items (movement_id, product_id, qnty)
    VALUES (v_mid, v_pid, abs(p_delta));

  SELECT qnty INTO v_qty FROM inventory WHERE product_id = v_pid;
  RETURN v_qty;
END; $$;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_type      ON products (type);
CREATE INDEX IF NOT EXISTS idx_products_updated    ON products (updated_at);
CREATE INDEX IF NOT EXISTS idx_movements_occurred  ON movements (occurred_at);
CREATE INDEX IF NOT EXISTS idx_movement_items_prod ON movement_items (product_id);

-- ============================================================
-- RLS (contar es libre; lo sensible, para coordinadores)
-- ============================================================
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms          ENABLE ROW LEVEL SECURITY;

-- Lectura pública del catálogo, inventario y movimientos
CREATE POLICY "read_products"   ON products       FOR SELECT USING (true);
CREATE POLICY "read_inventory"  ON inventory      FOR SELECT USING (true);
CREATE POLICY "read_movements"  ON movements      FOR SELECT USING (true);
CREATE POLICY "read_mitems"     ON movement_items FOR SELECT USING (true);

-- Contar sin login: crear productos y movimientos (el RPC apply_count
-- corre como SECURITY DEFINER, así que también funciona sin sesión).
CREATE POLICY "ins_products"  ON products       FOR INSERT WITH CHECK (true);
CREATE POLICY "ins_movements" ON movements      FOR INSERT WITH CHECK (true);
CREATE POLICY "ins_mitems"    ON movement_items FOR INSERT WITH CHECK (true);

-- Editar/borrar catálogo: solo coordinador autenticado
CREATE POLICY "upd_products" ON products FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM user_profiles))
  WITH CHECK (auth.uid() IN (SELECT id FROM user_profiles));
CREATE POLICY "del_products" ON products FOR DELETE
  USING (auth.uid() IN (SELECT id FROM user_profiles));

-- Checkpoints y comms: lectura pública; escritura de coordinador
CREATE POLICY "read_checkpoints"  ON checkpoints FOR SELECT USING (true);
CREATE POLICY "coord_checkpoints" ON checkpoints FOR ALL
  USING (auth.uid() IN (SELECT id FROM user_profiles))
  WITH CHECK (auth.uid() IN (SELECT id FROM user_profiles));
CREATE POLICY "read_comms"  ON comms FOR SELECT USING (true);
CREATE POLICY "ins_comms"   ON comms FOR INSERT WITH CHECK (true);

-- Nota: user_profiles / persons / phones / requests quedan sin política
-- pública (solo service_role) hasta que acopio/comandas las usen.
