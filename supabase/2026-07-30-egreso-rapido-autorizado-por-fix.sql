-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Reemplaza la migración 2026-07-29-egreso-rapido-autorizado-por.sql, que
-- NO funcionó: esa migración agregaba una función aparte que hacía
-- `UPDATE comandas ... WHERE movement_id = (SELECT id FROM movements
-- WHERE client_op_id = ...)`, asumiendo que create_comanda_rapida ya
-- enlazaba comandas.movement_id. Verificado en producción (vía REST,
-- 2026-07-30) que NO lo hace: los egresos rápidos crean el movimiento
-- pero nunca escriben comandas.movement_id, así que la vista
-- comandas_movement_info (WHERE movement_id IS NOT NULL) nunca los
-- expone — la Bitácora ni siquiera detecta que el movimiento viene de
-- una comanda, y cae al texto plano de movements.note (vacío = "sin
-- nombre"). autorizado_por tampoco se llenaba (solo aprobado_por).
--
-- Este archivo reemplaza create_comanda_rapida completa (se pegó su
-- cuerpo real, obtenido con `select pg_get_functiondef(oid) from pg_proc
-- where proname = 'create_comanda_rapida'`) con dos cambios puntuales,
-- todo lo demás queda idéntico:
--   1. La comanda nace con autorizado_por = "Nombre Apellido (Uso Interno)".
--   2. Tras crear el movimiento (paso 7), se enlaza
--      comandas.movement_id = v_movement_id — así comandas_movement_info
--      y el join de la Bitácora (js/views/registro.js) sí la encuentran.
--
-- CREATE OR REPLACE conserva los GRANT existentes sobre la función.
--
-- Limpieza: también elimina la función auxiliar de la migración anterior,
-- que quedó sin uso.
--
-- Idempotente: se puede correr más de una vez sin problema.
-- ============================================================

CREATE OR REPLACE FUNCTION new_schema_archive.create_comanda_rapida(p_actor_ci bigint, p_solicitante_ci bigint, p_items jsonb, p_client_op_id text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
 RETURNS TABLE(comanda_id bigint, movement_id bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'new_schema_archive', 'public', 'extensions'
AS $function$
declare
  v_actor_role new_schema_archive.person_role;
  v_actor_nombre text;
  v_autorizado_por text;
  v_ubicacion_id bigint;
  v_ubicacion_nombre text;
  v_comanda_id bigint;
  v_movement_id bigint;
  v_expected int;
  v_inserted int;
  v_pid bigint;
  v_pname text;
  v_punidad text;
  v_qty int;
  v_disponible int;
  v_item jsonb;
begin
  -- 1. Autorización: mismo patrón que apply_count/uncount_item/delete_count/create_movement
  select role into v_actor_role from new_schema_archive.person_credentials where ci = p_actor_ci;
  if v_actor_role is null or v_actor_role = 'voluntario' then
    raise exception 'Rol sin permiso para registrar una entrega';
  end if;

  -- 2. Idempotencia: reintento con el mismo client_op_id devuelve el mismo resultado (no-op)
  if p_client_op_id is not null then
    select c.id into v_comanda_id from new_schema_archive.comandas c where c.client_op_id = p_client_op_id;
    if found then
      select m.id into v_movement_id from new_schema_archive.movements m where m.client_op_id = p_client_op_id;
      return query select v_comanda_id, v_movement_id;
      return;
    end if;
  end if;

  -- 3. Validaciones de entrada
  if p_solicitante_ci is null or not exists (
    select 1 from new_schema_archive.persons where ci = p_solicitante_ci
  ) then
    raise exception 'El solicitante no existe';
  end if;

  v_expected := jsonb_array_length(p_items);
  if v_expected is null or v_expected = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select (name || ' ' || surname) into v_actor_nombre from new_schema_archive.persons where ci = p_actor_ci;
  v_autorizado_por := v_actor_nombre || ' (Uso Interno)';

  -- 4. Ubicación de destino SIEMPRE resuelta en el servidor (nunca aceptada del cliente).
  --    Fija a "UCV Centro de Acopio" (no "la primera genérica alfabética" — hay más de
  --    una ubicación genérica activa, ej. "Personal", y esa no es el destino correcto
  --    para una salida física de almacén de Inventario).
  select id, nombre into v_ubicacion_id, v_ubicacion_nombre
    from new_schema_archive.ubicaciones
   where es_generica and deleted_at is null and nombre = 'UCV Centro de Acopio'
   limit 1;
  if v_ubicacion_id is null then
    raise exception 'No existe la ubicación genérica "UCV Centro de Acopio" — no se puede registrar la entrega';
  end if;

  -- 5. Comanda ya "completada" (mismo criterio que origen=rapida en Comandas: nace aprobada de inmediato)
  insert into new_schema_archive.comandas (
    solicitante_ci, estudiante_resp_ci, responsable_entrega_ci,
    aprobado_por_ci, aprobado_por, created_by_ci, created_by,
    ubicacion_id, fecha, hora_salida, hora_llegada,
    status, origen, processed_at, notas, client_op_id, autorizado_por
  ) values (
    p_solicitante_ci, p_actor_ci, p_actor_ci,
    p_actor_ci, v_actor_nombre, p_actor_ci, v_actor_nombre,
    v_ubicacion_id, current_date, current_time, current_time,
    'completada', 'rapida', now(), p_note, p_client_op_id, v_autorizado_por
  ) returning id into v_comanda_id;

  -- 6. comanda_items + chequeo temprano de stock por ítem (mensaje legible para el usuario)
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'qnty')::int;

    if v_pid is null or v_qty is null or v_qty <= 0 then
      raise exception 'Ítem inválido en el carrito (producto o cantidad faltante)';
    end if;

    select p.name, p.unidad into v_pname, v_punidad
      from new_schema_archive.products p
     where p.id = v_pid and p.deleted_at is null;
    if not found then
      raise exception 'Producto % no existe o fue eliminado', v_pid;
    end if;

    select qnty into v_disponible from new_schema_archive.inventory
     where product_id = v_pid for update;
    if v_disponible is null or v_disponible < v_qty then
      raise exception 'No hay suficiente disponibilidad de "%" (disponible: %, solicitado: %)',
        v_pname, coalesce(v_disponible, 0), v_qty;
    end if;

    insert into new_schema_archive.comanda_items (comanda_id, producto, producto_id, cantidad, unidad)
      values (v_comanda_id, v_pname, v_pid, v_qty, v_punidad);
  end loop;

  -- 7. movement de salida (destino = nombre de la ubicación genérica resuelta arriba)
  insert into new_schema_archive.movements (direction, destination, note, client_op_id, occurred_at)
    values ('out', v_ubicacion_nombre, p_note, p_client_op_id, now())
    returning id into v_movement_id;

  -- 7b. Enlazar la comanda con el movimiento que acaba de crear: sin esto,
  --     comandas_movement_info (WHERE movement_id IS NOT NULL) nunca la
  --     expone y la Bitácora de Inventario no la reconoce como comanda.
  update new_schema_archive.comandas set movement_id = v_movement_id where id = v_comanda_id;

  -- 8. movement_items — dispara trg_movement_items_apply, ÚNICO ajuste real de inventory.qnty.
  --    Validar filas insertadas vs. esperadas antes de devolver (mismo criterio defensivo
  --    que ya usa create_movement): si algo no coincidió, aborta con rollback completo
  --    (comanda + comanda_items + movement + movement_items, todo o nada).
  insert into new_schema_archive.movement_items (movement_id, product_id, qnty)
    select v_movement_id, (elem->>'product_id')::bigint, (elem->>'qnty')::int
    from jsonb_array_elements(p_items) elem;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'create_comanda_rapida: % de % líneas no coincidieron con products', (v_expected - v_inserted), v_expected;
  end if;

  -- 9. Marcar los productos tocados como recién actualizados: el pull
  --    incremental de los 3 clientes (Inventario/Acopio) filtra por
  --    products.updated_at, y el trigger de arriba solo toca inventory.qnty
  --    — sin este UPDATE, ningún cliente vería el stock nuevo hasta que algo
  --    más (ajeno a este egreso) tocara esa misma fila de products.
  update new_schema_archive.products up
     set updated_at = now()
   where up.id in (select (elem->>'product_id')::bigint from jsonb_array_elements(p_items) elem);

  return query select v_comanda_id, v_movement_id;
end;
$function$;

DROP FUNCTION IF EXISTS new_schema_archive.set_comanda_rapida_autorizado_por(text, text);
