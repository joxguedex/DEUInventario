-- ══════════════════════════════════════════════════════════════════════════
--  Fix: carrera entre grupos al crear una categoría/insumo nuevo al mismo
--  tiempo — buscar-y-reutilizar no es atómico
-- ------------------------------------------------------------------------
--  create_category() y add_product_to_grupo() (catálogo compartido, revisión
--  "productos multigrupo") hacen "SELECT por nombre → si no existe, INSERT"
--  para reutilizar una categoría/producto ya creado por OTRO grupo en vez de
--  duplicarlo. Ese patrón no es atómico: si dos coordinadores de grupos
--  distintos escriben el mismo nombre casi al mismo tiempo, ambos pueden
--  pasar el SELECT sin ver nada (ninguno commiteó todavía) e intentar el
--  INSERT los dos — el índice único parcial (categories_nombre_unique_idx /
--  products_category_name_unidad_unique_idx) ya evita la fila duplicada,
--  pero sin este fix el segundo en llegar se llevaba un unique_violation
--  (409) crudo en vez de terminar sumándose a la fila que ganó la carrera
--  (el mismo resultado que si hubiera usado "adoptar de otro grupo").
--
--  Arreglo: envolver cada INSERT en un `begin/exception when
--  unique_violation` que releé y reutiliza la fila del ganador.
--
--  Pegar entero en el SQL Editor de Supabase (proyecto SIBEX UCV, schema
--  `sibex`). Reemplaza ambas funciones enteras — idempotente.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.create_category(p_nombre text, p_grupo_id bigint default null) returns bigint
language plpgsql security definer set search_path = sibex as $$
declare v_id bigint; v_grupo bigint; v_nombre text;
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede crear categorías';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;
  v_nombre := btrim(p_nombre);
  if v_nombre is null or v_nombre = '' then
    raise exception 'El nombre de la categoría es obligatorio';
  end if;

  select id into v_id from sibex.categories where lower(nombre) = lower(v_nombre);
  if v_id is null then
    begin
      insert into sibex.categories (nombre) values (v_nombre) returning id into v_id;
    exception when unique_violation then
      select id into v_id from sibex.categories where lower(nombre) = lower(v_nombre);
      if v_id is null then raise; end if;
    end;
  end if;

  insert into sibex.category_grupos (category_id, grupo_id) values (v_id, v_grupo)
    on conflict (category_id, grupo_id) do nothing;

  return v_id;
end;
$$;
grant execute on function sibex.create_category(text, bigint) to authenticated;


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
