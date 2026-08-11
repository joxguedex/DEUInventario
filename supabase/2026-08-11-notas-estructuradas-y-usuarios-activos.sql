-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Incremental sobre supabase/new-project-schema.sql, ya aplicado en tu
-- proyecto — NO vuelvas a correr el archivo completo (fallaría en el primer
-- `create table`, ya existen). Este script trae al día lo que cambió en
-- esta sesión:
--   1. actor_note() — nueva, arma "Nombre - Área - Tipo" para movements.note.
--   2. apply_count() — gana un 4to parámetro obligatorio (p_origen:
--      'ingreso'|'conteo'); se dropea la versión de 3 argumentos primero
--      (CREATE OR REPLACE no permite agregar un parámetro nuevo tal cual).
--   3. create_comanda_rapida() — mismo firma, ahora escribe el note
--      estructurado (Tipo='Egreso') en vez de p_note.
--   4. list_users_with_access() — gana la columna `active` (lee
--      auth.users.banned_until); se dropea primero por el mismo motivo que 2.
--   5. count_active_users() — nueva, para el stat "Usuarios activos" de
--      Resumen (cualquier sesión puede llamarla, a diferencia de la anterior).
--
-- Después de correr esto, REDESPLEGAR la Edge Function (agregó la acción
-- set_active, activar/desactivar usuarios):
--   supabase functions deploy manage-users
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

create or replace function public.actor_note(p_tipo text) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_ci bigint; v_nombre text; v_area_label text;
begin
  v_ci := public.current_person_ci();
  select (name || ' ' || surname) into v_nombre from public.persons where ci = v_ci;

  if public.is_admin() then
    v_area_label := 'Administrador';
  elsif public.current_area() = 'general' then
    v_area_label := 'General';
  else
    select nombre into v_area_label from public.categories where id = public.current_category_id();
  end if;

  return coalesce(v_nombre, 'Desconocido') || ' - ' || coalesce(v_area_label, '—') || ' - ' || p_tipo;
end;
$$;


drop function if exists public.apply_count(text, text, integer);
create or replace function public.apply_count(
  p_client_op_id       text,
  p_product_client_id  text,
  p_delta              integer,
  p_origen             text
) returns integer
language plpgsql security definer set search_path = public as $$
declare v_pid bigint; v_cat bigint; v_mid bigint; v_qty integer; v_ci bigint; v_tipo text;
begin
  if public.current_role() not in ('admin', 'coordinador') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  if p_origen not in ('ingreso', 'conteo') then
    raise exception 'Origen inválido: debe ser ingreso o conteo';
  end if;
  v_tipo := case p_origen when 'ingreso' then 'Recepción' else 'Conteo' end;
  v_ci := public.current_person_ci();

  select id, category_id into v_pid, v_cat from public.products where client_id = p_product_client_id;
  if v_pid is null then
    raise exception 'Producto % no existe', p_product_client_id;
  end if;
  if not public.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  if p_client_op_id is not null and exists (
    select 1 from public.movements where client_op_id = p_client_op_id
  ) then
    select qnty into v_qty from public.inventory where product_id = v_pid;
    return v_qty;
  end if;

  if p_delta <> 0 then
    insert into public.movements (direction, note, client_op_id, delivered_by)
      values (
        case when p_delta > 0 then 'in'::public.movement_direction else 'out'::public.movement_direction end,
        public.actor_note(v_tipo), p_client_op_id, v_ci
      ) returning id into v_mid;

    insert into public.movement_items (movement_id, product_id, qnty)
      values (v_mid, v_pid, abs(p_delta));
  end if;

  update public.inventory
     set last_counted_at = now(),
         last_counted_by = coalesce((select name || ' ' || surname from public.persons where ci = v_ci), last_counted_by)
   where product_id = v_pid;

  select qnty into v_qty from public.inventory where product_id = v_pid;
  return v_qty;
end;
$$;
grant execute on function public.apply_count(text, text, integer, text) to authenticated;


create or replace function public.create_comanda_rapida(
  p_solicitante_ci  bigint,
  p_items           jsonb,
  p_client_op_id    text default null,
  p_note            text default null
) returns table(comanda_id bigint, movement_id bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text; v_autorizado_por text;
  v_ubicacion_id bigint; v_ubicacion_nombre text;
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

  if p_client_op_id is not null then
    select c.id into v_comanda_id from public.comandas c where c.client_op_id = p_client_op_id;
    if found then
      select m.id into v_movement_id from public.movements m where m.client_op_id = p_client_op_id;
      return query select v_comanda_id, v_movement_id;
      return;
    end if;
  end if;

  if p_solicitante_ci is null or not exists (select 1 from public.persons where ci = p_solicitante_ci) then
    raise exception 'El solicitante no existe';
  end if;

  v_expected := jsonb_array_length(p_items);
  if v_expected is null or v_expected = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select (name || ' ' || surname) into v_actor_nombre from public.persons where ci = v_ci;
  v_autorizado_por := v_actor_nombre || ' (Uso Interno)';

  select id, nombre into v_ubicacion_id, v_ubicacion_nombre
    from public.ubicaciones
   where es_default_egreso and deleted_at is null
   limit 1;
  if v_ubicacion_id is null then
    raise exception 'No hay una ubicación marcada como destino por defecto de Egreso Rápido — un admin debe configurar una en Ubicaciones (es_default_egreso).';
  end if;

  insert into public.comandas (
    solicitante_ci, estudiante_resp_ci, responsable_entrega_ci,
    aprobado_por_ci, aprobado_por, created_by_ci, created_by,
    ubicacion_id, fecha, hora_salida, hora_llegada,
    status, origen, processed_at, notas, client_op_id, autorizado_por
  ) values (
    p_solicitante_ci, v_ci, v_ci,
    v_ci, v_actor_nombre, v_ci, v_actor_nombre,
    v_ubicacion_id, current_date, current_time, current_time,
    'completada', 'rapida', now(), p_note, p_client_op_id, v_autorizado_por
  ) returning id into v_comanda_id;

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

  insert into public.movements (direction, destination, note, client_op_id, occurred_at, delivered_by)
    values ('out', v_ubicacion_nombre, public.actor_note('Egreso'), p_client_op_id, now(), v_ci)
    returning id into v_movement_id;

  update public.comandas set movement_id = v_movement_id where id = v_comanda_id;

  insert into public.movement_items (movement_id, product_id, qnty)
    select v_movement_id, (elem->>'product_id')::bigint, (elem->>'qnty')::int
    from jsonb_array_elements(p_items) elem;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'create_comanda_rapida: % de % líneas no coincidieron con products', (v_expected - v_inserted), v_expected;
  end if;

  update public.products up set updated_at = now()
   where up.id in (select (elem->>'product_id')::bigint from jsonb_array_elements(p_items) elem);

  return query select v_comanda_id, v_movement_id;
end;
$$;
grant execute on function public.create_comanda_rapida(bigint, jsonb, text, text) to authenticated;


drop function if exists public.list_users_with_access();
create or replace function public.list_users_with_access() returns table(
  ci bigint, name text, surname text, email text, role text, area text, active boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede listar usuarios';
  end if;

  return query
    select p.ci, p.name, p.surname, u.email::text,
           u.raw_app_meta_data ->> 'role', u.raw_app_meta_data ->> 'area',
           (u.banned_until is null or u.banned_until < now())
    from public.persons p
    join auth.users u on u.id = p.auth_user_id
    where u.raw_app_meta_data ->> 'role' is not null
      and u.raw_app_meta_data ->> 'role' <> 'admin'
    order by p.name, p.surname;
end;
$$;
grant execute on function public.list_users_with_access() to authenticated;


create or replace function public.count_active_users() returns integer
language sql security definer set search_path = public as $$
  select count(*)::integer
  from public.persons p
  join auth.users u on u.id = p.auth_user_id
  where u.raw_app_meta_data ->> 'role' in ('admin', 'coordinador')
    and (u.banned_until is null or u.banned_until < now())
$$;
grant execute on function public.count_active_users() to authenticated;
