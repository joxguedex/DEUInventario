-- ============================================================
-- Corrección de Permisos RLS (Row-Level Security)
-- ============================================================
-- Este script soluciona el error que impide crear insumos nuevos 
-- cuando un voluntario (sin permisos de administrador) intenta 
-- agregarlos desde el celular. 
--
-- Al agregar la etiqueta SECURITY DEFINER, el "trigger" se 
-- ejecuta con los permisos del sistema, permitiendo que 
-- la fila en 'inventory' se cree exitosamente.

CREATE OR REPLACE FUNCTION create_inventory_row() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id) VALUES (NEW.id)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
