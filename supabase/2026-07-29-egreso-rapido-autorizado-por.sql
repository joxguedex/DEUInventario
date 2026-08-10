-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Para: que la comanda que genera un Egreso Rápido (GBSInventario,
-- origen='rapida') llegue con "Autorizado por" lleno en vez de vacío
-- (hoy la Bitácora muestra "sin especificar" porque create_comanda_rapida
-- no toca esa columna).
--
-- No se toca create_comanda_rapida (no vive en este repo, y reescribirla
-- sin ver su cuerpo actual arriesga romper UCVComandas). En su lugar, esta
-- función aparte hace un UPDATE dirigido usando el mismo client_op_id que
-- ya viaja en el payload de create_comanda_rapida (columna única en
-- movements, y comandas.movement_id apunta a ese movimiento). El cliente
-- (js/views/egresorapido.js) la llama justo después de que la comanda se
-- creó con éxito, con "Nombre Apellido (Uso Interno)" del usuario logueado.
--
-- SECURITY DEFINER porque anon no tiene UPDATE sobre `comandas` (mismo
-- motivo por el que 2026-07-27-bitacora-procedencia.sql expone una vista
-- en vez de la tabla completa).
--
-- Idempotente: se puede correr más de una vez sin problema.
-- ============================================================

CREATE OR REPLACE FUNCTION new_schema_archive.set_comanda_rapida_autorizado_por(
  p_client_op_id text,
  p_autorizado_por text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = new_schema_archive, pg_temp
AS $$
  UPDATE new_schema_archive.comandas c
  SET autorizado_por = p_autorizado_por
  FROM new_schema_archive.movements m
  WHERE c.movement_id = m.id
    AND m.client_op_id = p_client_op_id;
$$;

GRANT EXECUTE ON FUNCTION new_schema_archive.set_comanda_rapida_autorizado_por(text, text) TO anon;
