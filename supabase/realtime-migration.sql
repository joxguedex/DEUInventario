-- ============================================================
-- GBSInventario · Activar la sincronización en vivo
-- ------------------------------------------------------------
-- Ejecutar UNA VEZ en Supabase → SQL Editor, después de
-- supabase-setup.sql y acopio-sync-migration.sql.
--
-- Sin esto el WebSocket conecta y reporta "SUBSCRIBED", pero
-- Postgres nunca publica los cambios: los dispositivos solo se
-- enteran cuando corre el timer de 30 s.
-- ============================================================

-- ── 1) Publicar las tablas en el stream de Realtime ────────
-- inventory → cambia la cantidad (el conteo de otro dispositivo)
-- products  → alta de un insumo nuevo o edición del catálogo
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Para que los eventos de UPDATE viajen con la fila completa
-- (con la identidad por defecto solo llega la PK).
ALTER TABLE inventory REPLICA IDENTITY FULL;
ALTER TABLE products  REPLICA IDENTITY FULL;


-- ── 2) Permitir el upsert de products sin sesión ───────────
-- El push hace POST /rest/v1/products?on_conflict=client_id con
-- Prefer: resolution=merge-duplicates. Eso necesita permiso de
-- UPDATE, pero "upd_products" solo lo concede a un coordinador
-- autenticado: un voluntario anónimo recibe 403 y su insumo nuevo
-- nunca sube.
--
-- Se separan las dos operaciones:
--   · merge del upsert  → abierto (el voluntario solo reescribe
--     nombre/medida/tipo/umbral de un insumo que él mismo creó)
--   · DELETE            → sigue siendo solo del coordinador
DROP POLICY IF EXISTS "upd_products" ON products;
CREATE POLICY "upd_products" ON products FOR UPDATE
  USING (true) WITH CHECK (true);

-- (del_products se queda como está: solo coordinador autenticado)


-- ── 3) Índice del pull incremental ─────────────────────────
-- Ya existe como idx_products_updated en supabase-setup.sql.
-- Se repite aquí por si esa base se creó antes de ese índice.
CREATE INDEX IF NOT EXISTS idx_products_updated ON products (updated_at);
