-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Egreso Rápido pedía elegir/crear un "Solicitante" (fila en `persons`),
-- pero no había forma de ver ni editar esas personas después de creadas.
-- Se reemplaza por un campo de texto libre ("Destino") que va directo a
-- comandas.notas (p_note) — el cliente ya no manda p_solicitante_ci (envía
-- null explícito). `comandas.solicitante_ci` sigue siendo una columna
-- nullable normal: esta función solo deja de EXIGIR que venga poblada.
--
-- Firma sin cambios (mismos 4 parámetros/tipo de retorno) — no hace falta
-- DROP FUNCTION antes del CREATE OR REPLACE.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

create or replace function public.create_comanda_rapida(
  p_solicitante_ci  bigint,
  p_items           jsonb,   -- [{"product_id": bigint, "qnty": int}, ...]
  p_client_op_id    text default null,
  p_note            text default null
) returns table(comanda_id bigint, movement_id bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text; v_autorizado_por text;
  v_comanda_id bigint; v_movement_id bigint;
  v_expected int; v_inserted int;
  v_pid bigint; v_pname text; v_punidad text; v_pcat bigint; v_qty int; v_disponible int;
  v_item jsonb;
begin
  v_role := public.current_role();
  v_ci := public.current_person_ci();
  if v_role not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para registrar una entrega';
  end if;

  -- Idempotencia: reintento con el mismo client_op_id devuelve el mismo resultado.
  if p_client_op_id is not null then
    select c.id into v_comanda_id from public.comandas c where c.client_op_id = p_client_op_id;
    if found then
      select m.id into v_movement_id from public.movements m where m.client_op_id = p_client_op_id;
      return query select v_comanda_id, v_movement_id;
      return;
    end if;
  end if;

  -- Sin Solicitante a propósito (ver comentario de cabecera) — p_solicitante_ci
  -- queda null desde el cliente; se sigue validando SI algún día se vuelve a
  -- pasar un valor no nulo, pero ya no es obligatorio.
  if p_solicitante_ci is not null and not exists (select 1 from public.persons where ci = p_solicitante_ci) then
    raise exception 'El solicitante no existe';
  end if;

  v_expected := jsonb_array_length(p_items);
  if v_expected is null or v_expected = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select (name || ' ' || surname) into v_actor_nombre from public.persons where ci = v_ci;
  v_autorizado_por := v_actor_nombre || ' (Uso Interno)';

  -- Sin ubicación por ahora (ver 2026-08-10-egreso-sin-ubicacion.sql) —
  -- ubicacion_id queda NULL (columna ya nullable).
  insert into public.comandas (
    solicitante_ci, estudiante_resp_ci, responsable_entrega_ci,
    aprobado_por_ci, aprobado_por, created_by_ci, created_by,
    fecha, hora_salida, hora_llegada,
    status, origen, processed_at, notas, client_op_id, autorizado_por
  ) values (
    p_solicitante_ci, v_ci, v_ci,
    v_ci, v_actor_nombre, v_ci, v_actor_nombre,
    current_date, current_time, current_time,
    'completada', 'rapida', now(), p_note, p_client_op_id, v_autorizado_por
  ) returning id into v_comanda_id;

  -- comanda_items + chequeo temprano de stock y categoría por ítem.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'qnty')::int;

    if v_pid is null or v_qty is null or v_qty <= 0 then
      raise exception 'Ítem inválido en el carrito (producto o cantidad faltante)';
    end if;

    select p.name, p.unidad, p.category_id into v_pname, v_punidad, v_pcat
      from public.products p where p.id = v_pid and p.deleted_at is null;
    if not found then
      raise exception 'Producto % no existe o fue eliminado', v_pid;
    end if;
    if not public.can_access_category(v_pcat) then
      raise exception 'No tienes permiso para egresar insumos de esta categoría (%)', v_pname;
    end if;

    select qnty into v_disponible from public.inventory where product_id = v_pid for update;
    if v_disponible is null or v_disponible < v_qty then
      raise exception 'No hay suficiente disponibilidad de "%" (disponible: %, solicitado: %)',
        v_pname, coalesce(v_disponible, 0), v_qty;
    end if;

    insert into public.comanda_items (comanda_id, producto, producto_id, cantidad, unidad)
      values (v_comanda_id, v_pname, v_pid, v_qty, v_punidad);
  end loop;

  -- movements.note SIEMPRE es el tag estructurado "Nombre - Área - Tipo"
  -- (acá, Tipo = 'Egreso') — p_note es texto libre del formulario, va aparte
  -- en comandas.notas (arriba), nunca pisa este formato. Sin destination por
  -- el mismo motivo que ubicacion_id arriba (columna ya nullable).
  insert into public.movements (direction, note, client_op_id, occurred_at, delivered_by)
    values ('out', public.actor_note('Egreso'), p_client_op_id, now(), v_ci)
    returning id into v_movement_id;

  update public.comandas set movement_id = v_movement_id where id = v_comanda_id;

  insert into public.movement_items (movement_id, product_id, qnty)
    select v_movement_id, (elem->>'product_id')::bigint, (elem->>'qnty')::int
    from jsonb_array_elements(p_items) elem;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'create_comanda_rapida: % de % líneas no coincidieron con products', (v_expected - v_inserted), v_expected;
  end if;

  -- El pull incremental del cliente filtra por products.updated_at (no por
  -- inventory) — sin esto, ningún cliente vería el stock nuevo hasta que
  -- algo más, ajeno a este egreso, tocara esa misma fila de products.
  update public.products up set updated_at = now()
   where up.id in (select (elem->>'product_id')::bigint from jsonb_array_elements(p_items) elem);

  return query select v_comanda_id, v_movement_id;
end;
$$;

-- Refrescar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
