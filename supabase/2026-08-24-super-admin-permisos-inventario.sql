-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Bug: un super_admin podía CREAR un insumo nuevo (esa parte pasa por RLS,
-- que sí incluye a super_admin) pero al intentar cargarle una cantidad de
-- stock inicial recibía "Rol sin permiso para modificar el inventario" —
-- apply_count/uncount_item/delete_count/merge_product chequeaban el rol a
-- mano con `current_role() not in ('admin', 'coordinador')`, sin incluir
-- 'super_admin' (a diferencia de sibex.can_access_category(), que estas
-- mismas funciones llaman más abajo y SÍ lo cubre vía is_super_admin()).
-- Se agrega 'super_admin' a esos cuatro chequeos y a la política RLS de
-- person_status (activar/desactivar usuarios), que tenía el mismo hueco.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

create or replace function sibex.apply_count(
  p_client_op_id       text,
  p_product_client_id  text,
  p_delta              integer,
  p_origen             text
) returns integer
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint; v_mid bigint; v_qty integer; v_ci bigint; v_tipo text;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  if p_origen not in ('ingreso', 'conteo') then
    raise exception 'Origen inválido: debe ser ingreso o conteo';
  end if;
  v_tipo := case p_origen when 'ingreso' then 'Recepción' else 'Conteo' end;
  v_ci := sibex.current_person_ci();

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then
    raise exception 'Producto % no existe', p_product_client_id;
  end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  if p_client_op_id is not null and exists (
    select 1 from sibex.movements where client_op_id = p_client_op_id
  ) then
    select qnty into v_qty from sibex.inventory where product_id = v_pid;
    return v_qty;
  end if;

  if p_delta <> 0 then
    insert into sibex.movements (direction, note, client_op_id, delivered_by)
      values (
        case when p_delta > 0 then 'in'::sibex.movement_direction else 'out'::sibex.movement_direction end,
        sibex.actor_note(v_tipo), p_client_op_id, v_ci
      ) returning id into v_mid;

    insert into sibex.movement_items (movement_id, product_id, qnty)
      values (v_mid, v_pid, abs(p_delta));
  end if;

  update sibex.inventory
     set last_counted_at = now(),
         last_counted_by = coalesce((select name || ' ' || surname from sibex.persons where ci = v_ci), last_counted_by)
   where product_id = v_pid;

  select qnty into v_qty from sibex.inventory where product_id = v_pid;
  return v_qty;
end;
$$;
grant execute on function sibex.apply_count(text, text, integer, text) to authenticated;

create or replace function sibex.uncount_item(p_product_client_id text) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then return; end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  delete from sibex.movements
   where id in (select movement_id from sibex.movement_items where product_id = v_pid);

  update sibex.inventory
     set qnty = 0, last_counted_at = null, last_counted_by = null
   where product_id = v_pid;
end;
$$;
grant execute on function sibex.uncount_item(text) to authenticated;

create or replace function sibex.delete_count(p_client_op_id text) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_mid bigint; v_product_ids bigint[];
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;

  select id into v_mid from sibex.movements where client_op_id = p_client_op_id;
  if v_mid is null then return; end if;

  select array_agg(product_id) into v_product_ids
    from sibex.movement_items where movement_id = v_mid;

  if exists (
    select 1 from unnest(v_product_ids) pid
    join sibex.products p on p.id = pid
    where not sibex.can_access_category(p.category_id)
  ) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  delete from sibex.movements where id = v_mid;

  update sibex.inventory i set
    last_counted_at = (
      select max(m.occurred_at) from sibex.movements m
      join sibex.movement_items mi on mi.movement_id = m.id
      where mi.product_id = i.product_id),
    last_counted_by = (
      select m.note from sibex.movements m
      join sibex.movement_items mi on mi.movement_id = m.id
      where mi.product_id = i.product_id
      order by m.occurred_at desc limit 1)
  where i.product_id = any(v_product_ids);
end;
$$;
grant execute on function sibex.delete_count(text) to authenticated;

create or replace function sibex.merge_product(
  p_source_client_id text, p_target_client_id text
) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_source bigint; v_target bigint; v_source_cat bigint; v_target_cat bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para fusionar insumos';
  end if;

  select id, category_id into v_source, v_source_cat from sibex.products where client_id = p_source_client_id;
  select id, category_id into v_target, v_target_cat from sibex.products where client_id = p_target_client_id;
  if v_source is null then raise exception 'Insumo de origen % no existe', p_source_client_id; end if;
  if v_target is null then raise exception 'Insumo de destino % no existe', p_target_client_id; end if;
  if not sibex.can_access_category(v_source_cat) or not sibex.can_access_category(v_target_cat) then
    raise exception 'No tienes permiso para fusionar insumos de esta categoría';
  end if;
  if v_source = v_target then return; end if;

  update sibex.movement_items set product_id = v_target where product_id = v_source;
  update sibex.inventory set qnty = 0 where product_id = v_source;
  update sibex.products set deleted_at = now(), updated_at = now() where id = v_source;
end;
$$;
grant execute on function sibex.merge_product(text, text) to authenticated;

drop policy if exists person_status_write on sibex.person_status;
create policy person_status_write on sibex.person_status for all
  to authenticated using (sibex.current_role() in ('admin', 'coordinador', 'super_admin'))
  with check (sibex.current_role() in ('admin', 'coordinador', 'super_admin'));
