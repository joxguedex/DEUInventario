-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Hoy, "Renombrar" → fusionar con un insumo existente (js/store.js#
-- fusionarInsumo) solo hace dos cosas: (1) le acredita al insumo destino
-- UN movimiento nuevo por el stock que tenía el insumo absorbido, y
-- (2) marca el insumo absorbido con deleted_at (soft delete, sale del
-- catálogo). El HISTORIAL de movimientos viejo del insumo absorbido
-- (movement_items.product_id) nunca se toca: sigue apuntando a esa fila
-- vieja para siempre.
--
-- Consecuencia real: como la Bitácora y Resumen · Ingresos leen
-- movement_items directo (no filtran products.deleted_at — confirmado en
-- js/views/registro.js y js/views/resumen.js), esos movimientos viejos
-- SÍ siguen apareciendo, pero bajo el nombre/identidad del insumo ya
-- fusionado — como una entrada duplicada y "fantasma" separada del
-- insumo vivo, en vez de sumarse a su historial.
--
-- Este archivo agrega merge_product(): reasigna TODO movement_items del
-- insumo de origen al de destino, para que su historial quede unificado
-- bajo la identidad viva. Mismo patrón de autorización que
-- apply_count/uncount_item/delete_count/create_movement (rol distinto de
-- 'voluntario'). No toca inventory.qnty del destino (ya lo actualiza el
-- movimiento de acreditación que el cliente aplica aparte vía
-- apply_count) — solo limpia el del origen a 0, igual que
-- supabase/merge-duplicates.sql hizo a mano en su momento.
--
-- Idempotente: se puede correr más de una vez sin problema, y el RPC en
-- sí también es seguro de reintentar (reasignar lo ya reasignado no hace
-- nada; volver a poner deleted_at/qnty=0 tampoco).
-- ============================================================

CREATE OR REPLACE FUNCTION new_schema_archive.merge_product(
  p_actor_ci           BIGINT,
  p_source_client_id   TEXT,
  p_target_client_id   TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'new_schema_archive', 'public', 'extensions'
AS $function$
DECLARE
  v_actor_role new_schema_archive.person_role;
  v_source     BIGINT;
  v_target     BIGINT;
BEGIN
  -- 1. Autorización: mismo patrón que apply_count/uncount_item/delete_count/create_movement
  SELECT role INTO v_actor_role FROM new_schema_archive.person_credentials WHERE ci = p_actor_ci;
  IF v_actor_role IS NULL OR v_actor_role = 'voluntario' THEN
    RAISE EXCEPTION 'Rol sin permiso para fusionar insumos';
  END IF;

  -- 2. Resolver origen/destino por client_id (el mismo id estable que usa el resto de la app)
  SELECT id INTO v_source FROM new_schema_archive.products WHERE client_id = p_source_client_id;
  SELECT id INTO v_target FROM new_schema_archive.products WHERE client_id = p_target_client_id;
  IF v_source IS NULL THEN RAISE EXCEPTION 'Insumo de origen % no existe', p_source_client_id; END IF;
  IF v_target IS NULL THEN RAISE EXCEPTION 'Insumo de destino % no existe', p_target_client_id; END IF;
  IF v_source = v_target THEN RETURN; END IF; -- nada que fusionar

  -- 3. Reatribuir TODO el historial del insumo absorbido al destino: a partir
  --    de acá, la Bitácora y Resumen · Ingresos lo muestran bajo la identidad
  --    del insumo vivo, en vez de bajo la fila ya fusionada.
  UPDATE new_schema_archive.movement_items
     SET product_id = v_target
   WHERE product_id = v_source;

  -- 4. Vaciar el inventario del origen (su stock real ya se acreditó al
  --    destino aparte, vía apply_count del lado del cliente — esto es solo
  --    higiene, igual criterio que supabase/merge-duplicates.sql).
  UPDATE new_schema_archive.inventory SET qnty = 0 WHERE product_id = v_source;

  -- 5. Soft delete del origen (mismo criterio que ya usa el resto de la app).
  UPDATE new_schema_archive.products
     SET deleted_at = now(), updated_at = now()
   WHERE id = v_source;
END;
$function$;

GRANT EXECUTE ON FUNCTION new_schema_archive.merge_product(BIGINT, TEXT, TEXT) TO anon, authenticated;

-- Refrescar el caché de esquema de PostgREST para que lo vea ya
NOTIFY pgrst, 'reload schema';
