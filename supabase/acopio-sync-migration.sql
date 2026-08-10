-- ============================================================
-- GBSInventario · Migración a arquitectura AcopioUCV
-- ============================================================
-- Este script adapta la tabla products para que su campo
-- updated_at cambie automáticamente cada vez que el stock
-- en la tabla inventory se modifica. De esta forma, el
-- motor "Incremental Pull" del celular sabe qué descargar.

CREATE OR REPLACE FUNCTION touch_product_updated_at() RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_touch_product ON inventory;
CREATE TRIGGER trg_inventory_touch_product AFTER UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION touch_product_updated_at();

-- Ejecutar este bloque asegura que todos los productos
-- queden con la fecha actualizada para el primer Sync
UPDATE products SET updated_at = now();
