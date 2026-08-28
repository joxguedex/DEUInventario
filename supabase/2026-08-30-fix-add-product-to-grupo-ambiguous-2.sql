-- ══════════════════════════════════════════════════════════════════════════
--  Fix: "column reference product_id is ambiguous" (42702) — segunda ronda,
--  add_product_to_grupo (adoptar insumo de otro grupo desde Ingreso Rápido)
-- ------------------------------------------------------------------------
--  El fix anterior (2026-08-28) calificó client_id/name/qnty con alias en
--  todo el cuerpo, pero dejó sin tocar dos lugares donde "product_id"
--  aparece como nombre de columna sin calificar: la lista de columnas del
--  INSERT y el arbiter del ON CONFLICT de `sibex.inventory`:
--
--    insert into sibex.inventory (product_id, grupo_id, qnty)
--      values (...)
--      on conflict (product_id, grupo_id) do update ...
--
--  Esa es justo la rama que se ejecuta al "adoptar" un insumo YA EXISTENTE
--  de otro grupo (el INSERT de `products` se salta porque el producto ya
--  se encontró) — coincide con el reporte: falla específicamente al usar
--  la sugerencia "usados por otros grupos", ya no al crear un insumo nuevo
--  desde cero.
--
--  En vez de seguir cazando referencias sueltas una por una, se agrega
--  `#variable_conflict use_column` (mismo pragma que ya usan
--  create_person()/list_users_with_access() en este mismo archivo) — le
--  dice a PL/pgSQL que ante cualquier ambigüedad entre una variable de
--  salida (returns table(...)) y una columna de tabla, prefiera SIEMPRE la
--  columna. En esta función es seguro: cada referencia sin calificar en su
--  cuerpo fue escrita a propósito para significar la columna, nunca la
--  variable OUT (las variables de salida solo se usan a través de sus alias
--  v_pid/v_client_id/v_name/v_qty en los `return query`).
--
--  Pegar entero en el SQL Editor de Supabase (proyecto SIBEX UCV, schema
--  `sibex`). Reemplaza la función entera — idempotente.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.add_product_to_grupo(
  p_client_id      text,
  p_name           text,
  p_unidad         text,
  p_category_id    bigint,
  p_umbral         integer default 10,
  p_umbral_max     integer default null,
  p_qnty           integer default 0,
  p_client_op_id   text default null,
  p_grupo_id       bigint default null
) returns table(product_id bigint, client_id text, name text, qnty integer)
language plpgsql security definer set search_path = sibex as $$
#variable_conflict use_column
declare
  v_grupo bigint; v_pid bigint; v_client_id text; v_name text; v_unidad text;
  v_mid bigint; v_ci bigint; v_qty integer;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para agregar insumos';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;
  if not sibex.can_access_category(p_category_id) then
    raise exception 'No tienes permiso para agregar insumos en esta categoría';
  end if;
  v_name := btrim(p_name);
  v_unidad := btrim(p_unidad);
  if v_name is null or v_name = '' then
    raise exception 'El nombre del insumo es obligatorio';
  end if;
  if v_unidad is null or v_unidad = '' then
    raise exception 'La unidad es obligatoria';
  end if;

  select pr.id, pr.client_id into v_pid, v_client_id
    from sibex.products pr
   where pr.category_id = p_category_id and pr.unidad = v_unidad
     and lower(btrim(pr.name)) = lower(v_name) and pr.deleted_at is null;

  if v_pid is null then
    begin
      insert into sibex.products (client_id, name, unidad, category_id, umbral, umbral_max)
        values (p_client_id, v_name, v_unidad, p_category_id, coalesce(p_umbral, 10), p_umbral_max)
        returning products.id, products.client_id into v_pid, v_client_id;
    exception when unique_violation then
      select pr.id, pr.client_id into v_pid, v_client_id
        from sibex.products pr
       where pr.category_id = p_category_id and pr.unidad = v_unidad
         and lower(btrim(pr.name)) = lower(v_name) and pr.deleted_at is null;
      if v_pid is null then raise; end if;
    end;
  end if;

  insert into sibex.inventory (product_id, grupo_id, qnty)
    values (v_pid, v_grupo, 0)
    on conflict (product_id, grupo_id) do update set deleted_at = null
    where inventory.deleted_at is not null;

  if p_client_op_id is not null and exists (select 1 from sibex.movements mv where mv.client_op_id = p_client_op_id) then
    select inv.qnty into v_qty from sibex.inventory inv where inv.product_id = v_pid and inv.grupo_id = v_grupo;
    return query select v_pid, v_client_id, v_name, v_qty;
    return;
  end if;

  v_ci := sibex.current_person_ci();
  if coalesce(p_qnty, 0) <> 0 then
    insert into sibex.movements (direction, note, client_op_id, delivered_by, grupo_id)
      values ('in', sibex.actor_note('Recepción'), p_client_op_id, v_ci, v_grupo)
      returning movements.id into v_mid;
    insert into sibex.movement_items (movement_id, product_id, qnty) values (v_mid, v_pid, abs(p_qnty));
  end if;

  update sibex.inventory inv
     set last_counted_at = now(),
         last_counted_by = coalesce((select pr.name || ' ' || pr.surname from sibex.persons pr where pr.ci = v_ci), inv.last_counted_by)
   where inv.product_id = v_pid and inv.grupo_id = v_grupo;

  select inv.qnty into v_qty from sibex.inventory inv where inv.product_id = v_pid and inv.grupo_id = v_grupo;
  return query select v_pid, v_client_id, v_name, v_qty;
end;
$$;
grant execute on function sibex.add_product_to_grupo(text, text, text, bigint, integer, integer, integer, text, bigint) to authenticated;
