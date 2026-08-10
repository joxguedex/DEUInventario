-- ============================================================
-- UCVInventario · Corrección de metadatos que no se sincronizan
-- ------------------------------------------------------------
-- Corrige tres pérdidas de datos y prepara la fusión de duplicados.
-- Ejecutar ANTES de desplegar el código nuevo y ANTES de
-- merge-duplicates.sql.
--
--   1. products.unidad     — la unidad ("bultos", "cajas") nunca subía:
--                            productPayload() no la enviaba y no había
--                            dónde guardarla. En la otra pantalla todo
--                            aparecía como "und".
--   2. inventory.last_counted_by — quién contó. El dato estaba en
--                            movements.note, que el pull nunca lee, así
--                            que la columna "Contado por" del Excel salía
--                            vacía para lo contado en otro dispositivo.
--   3. apply_count(delta=0) — un conteo confirmado en CERO reventaba:
--                            insertaba movement_items con qnty=0, contra
--                            el CHECK (qnty > 0). El push devolvía 400 y
--                            el cliente descartaba la operación.
--   4. products.merged_into — red de seguridad para la fusión: un
--                            dispositivo que aún no sincronizó puede
--                            contar sobre un insumo ya absorbido. El
--                            conteo se redirige a la fila canónica en
--                            vez de enterrarse.
-- ============================================================
BEGIN;

-- ── 1. Unidad del insumo ────────────────────────────────────
ALTER TABLE products  ADD COLUMN IF NOT EXISTS unidad TEXT NOT NULL DEFAULT 'und';

-- ── 2. Quién hizo el último conteo (last_counted_at ya existe) ──
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_counted_by TEXT;

-- ── 3. Puntero de fusión ────────────────────────────────────
ALTER TABLE products  ADD COLUMN IF NOT EXISTS merged_into BIGINT
  REFERENCES products (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_merged_into ON products (merged_into)
  WHERE merged_into IS NOT NULL;

COMMIT;


-- ============================================================
-- apply_count: reemplaza a la versión desplegada
-- ------------------------------------------------------------
-- Mantiene lo que ya hacía (idempotencia por client_op_id, movimiento
-- 'in'/'out', last_counted_at) y añade:
--   · sigue merged_into antes de aplicar nada
--   · registra last_counted_by
--   · delta = 0 no crea movimiento (solo confirma el conteo)
-- ============================================================
CREATE OR REPLACE FUNCTION apply_count(
  p_client_op_id       TEXT,
  p_product_client_id  TEXT,
  p_delta              INTEGER,
  p_counted_by         TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid BIGINT; v_next BIGINT; v_mid BIGINT; v_qty INTEGER; v_hops INTEGER := 0;
BEGIN
  SELECT id INTO v_pid FROM products WHERE client_id = p_product_client_id;
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'Producto % no existe', p_product_client_id;
  END IF;

  -- Seguir la cadena de fusiones. Un dispositivo desactualizado puede contar
  -- sobre un insumo absorbido; su conteo debe aterrizar en el canónico.
  LOOP
    SELECT merged_into INTO v_next FROM products WHERE id = v_pid;
    EXIT WHEN v_next IS NULL;
    v_pid := v_next;
    v_hops := v_hops + 1;
    IF v_hops > 10 THEN
      RAISE EXCEPTION 'Ciclo en merged_into para %', p_product_client_id;
    END IF;
  END LOOP;

  -- Idempotencia: si la operación ya se aplicó, devolver el stock actual.
  IF EXISTS (SELECT 1 FROM movements WHERE client_op_id = p_client_op_id) THEN
    SELECT qnty INTO v_qty FROM inventory WHERE product_id = v_pid;
    RETURN v_qty;
  END IF;

  -- delta = 0 es un conteo confirmado en cero: NO genera movimiento.
  -- movement_items exige qnty > 0 y movements exige al menos un item, así
  -- que crear el movimiento aquí abortaba la transacción.
  IF p_delta <> 0 THEN
    INSERT INTO movements (direction, note, client_op_id)
      VALUES (CASE WHEN p_delta > 0 THEN 'in'::movement_direction
                                    ELSE 'out'::movement_direction END,
              p_counted_by, p_client_op_id)
      RETURNING id INTO v_mid;

    INSERT INTO movement_items (movement_id, product_id, qnty)
      VALUES (v_mid, v_pid, abs(p_delta));
  END IF;

  -- Marca de conteo. Siempre, incluso con delta 0: es lo que distingue
  -- "no lo he contado" de "fui, miré y no hay nada".
  UPDATE inventory
     SET last_counted_at = now(),
         last_counted_by = COALESCE(p_counted_by, last_counted_by)
   WHERE product_id = v_pid;

  SELECT qnty INTO v_qty FROM inventory WHERE product_id = v_pid;
  RETURN v_qty;
END; $$;
