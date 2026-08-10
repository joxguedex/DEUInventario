-- ============================================================
-- UCVInventario · Arreglo de "desmarcar" y "borrar de la bitácora"
-- ------------------------------------------------------------
-- Dos RPC nuevos. Ejecutar en Supabase → SQL Editor.
--
-- Problema que resuelven:
--   apply_count SIEMPRE sella inventory.last_counted_at y nunca lo
--   limpia, y los movimientos son append-only. Por eso:
--     · desmarcar un insumo no se propagaba: qnty bajaba a 0 pero
--       last_counted_at seguía con fecha, y el pull deriva contado
--       = (qnty>0 OR last_counted_at) = true. Volvía a salir marcado.
--     · borrar un registro de la bitácora no lo borraba: se creaba
--       un movimiento compensatorio en vez de quitar el original, y
--       la bitácora (que se arma desde movement_items) lo seguía
--       mostrando.
-- ============================================================

-- ── uncount_item: retracta TODO el conteo de un insumo ─────
-- Borra sus movimientos, deja qnty=0 y last_counted_at=NULL, de modo
-- que el pull lo derive como NO contado en todos los dispositivos.
-- (Los conteos de esta app son movimientos de un solo ítem, así que
-- borrar por producto no afecta a otros insumos.)
CREATE OR REPLACE FUNCTION public.uncount_item(p_product_client_id TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid BIGINT; v_next BIGINT; v_hops INTEGER := 0;
BEGIN
  SELECT id INTO v_pid FROM products WHERE client_id = p_product_client_id;
  IF v_pid IS NULL THEN RETURN; END IF;

  -- seguir la cadena de fusiones (merged_into)
  LOOP
    SELECT merged_into INTO v_next FROM products WHERE id = v_pid;
    EXIT WHEN v_next IS NULL;
    v_pid := v_next; v_hops := v_hops + 1;
    IF v_hops > 10 THEN RAISE EXCEPTION 'Ciclo en merged_into para %', p_product_client_id; END IF;
  END LOOP;

  DELETE FROM movements
   WHERE id IN (SELECT movement_id FROM movement_items WHERE product_id = v_pid);

  UPDATE inventory
     SET qnty = 0, last_counted_at = NULL, last_counted_by = NULL
   WHERE product_id = v_pid;
END; $$;


-- ── delete_count: borra UN registro de la bitácora ─────────
-- Revierte el efecto de ese movimiento en el stock, recalcula
-- last_counted_at/by con lo que quede, y borra el movimiento (cascade
-- borra sus movement_items). Se identifica por client_op_id, que es lo
-- que la vista de bitácora ya trae de cada fila.
CREATE OR REPLACE FUNCTION public.delete_count(p_client_op_id TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mid BIGINT; v_dir movement_direction; r RECORD;
BEGIN
  SELECT id, direction INTO v_mid, v_dir
    FROM movements WHERE client_op_id = p_client_op_id;
  IF v_mid IS NULL THEN RETURN; END IF;   -- ya no existe: nada que hacer

  FOR r IN SELECT product_id, qnty FROM movement_items WHERE movement_id = v_mid LOOP
    -- revertir el efecto en el stock
    IF v_dir = 'in' THEN
      UPDATE inventory SET qnty = GREATEST(0, qnty - r.qnty) WHERE product_id = r.product_id;
    ELSE
      UPDATE inventory SET qnty = qnty + r.qnty WHERE product_id = r.product_id;
    END IF;

    -- recalcular la marca de conteo con los movimientos que quedan
    -- (NULL si no queda ninguno → el insumo vuelve a "no contado")
    UPDATE inventory i SET
      last_counted_at = (
        SELECT max(m.occurred_at)
          FROM movements m JOIN movement_items mi ON mi.movement_id = m.id
         WHERE mi.product_id = r.product_id AND m.id <> v_mid),
      last_counted_by = (
        SELECT m.note
          FROM movements m JOIN movement_items mi ON mi.movement_id = m.id
         WHERE mi.product_id = r.product_id AND m.id <> v_mid
         ORDER BY m.occurred_at DESC LIMIT 1)
    WHERE i.product_id = r.product_id;
  END LOOP;

  DELETE FROM movements WHERE id = v_mid;
END; $$;
