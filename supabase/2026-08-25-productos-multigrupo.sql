-- ══════════════════════════════════════════════════════════════════════════
--  Productos/categorías compartidos entre grupos de extensión — SIBEX UCV
-- ------------------------------------------------------------------------
--  Hoy cada categoría (y, por denormalización, cada producto) pertenece a UN
--  único grupo de extensión. Este script lo cambia: una categoría puede
--  vincularse a varios grupos (`category_grupos`, M2M), y un producto vuelve
--  a ser un catálogo compartido por categoría (nombre+unidad únicos POR
--  CATEGORÍA, ya no por grupo) — lo que varía por grupo es el CONTEO
--  (`inventory`), que ahora es 1 fila por (producto, grupo) en vez de 1 por
--  producto. Esto habilita: buscar-y-reutilizar al crear categorías/
--  productos (evita duplicados), ver el inventario de todos los grupos a la
--  vez con su etiqueta de grupo, totales por grupo en Resumen, y editar
--  nombre+categorías de un grupo.
--
--  Pegar entero en el SQL Editor de Supabase (proyecto SIBEX UCV, schema
--  `sibex` — ver js/env-config.js). Reflejado también en
--  `new-project-schema.sql` (schema `public`, fresh-install canónico) y
--  regenerado mecánicamente en `sibex-schema-install.sql`.
--
--  Orden del script (importa — cada paso depende de que el anterior haya
--  corrido primero):
--    1. Agrega movements.grupo_id/comandas.grupo_id, poblados desde
--       products.grupo_id ANTES de tocarlo.
--    2. Crea category_grupos y la puebla 1:1 desde categories.grupo_id.
--    3. Fusiona categorías duplicadas por nombre (nuevo requisito: nombre
--       único global case-insensitive) — reasigna category_grupos/
--       products.category_id/área de coordinadores a la canónica.
--    4. Agrega inventory.grupo_id, poblado desde products.grupo_id (todavía
--       intacto en este punto).
--    5. Fusiona productos duplicados por (category_id ya canónico, nombre,
--       unidad) entre distintos grupos — mismo patrón que merge_product
--       (mueve historial, suma conteos por grupo, soft-delete del perdedor).
--    6. Cambios de esquema: drop categories.grupo_id/products.grupo_id +
--       triggers viejos, PK compuesta de inventory, índices únicos nuevos,
--       inventory.updated_at (fix 2026-08-28, ver
--       2026-08-28-fix-inventory-updated-at.sql para aplicarlo suelto sobre
--       una base donde esta migración ya corrió).
--    7. Redefine can_access_category() y las RPCs/RLS de productos/
--       categorías/inventario/movimientos/comandas.
-- ══════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════
--  1. movements.grupo_id / comandas.grupo_id — backfill ANTES de tocar
--     products.grupo_id. Todo movimiento ocurre dentro de un único grupo
--     (lo crea un actor con un solo grupo de contexto a la vez), así que
--     denormalizarlo acá es seguro y evita tener que navegar
--     movement_items/comanda_items solo para saber el grupo en RLS.
-- ══════════════════════════════════════════════════════════════════════════

alter table sibex.movements add column grupo_id bigint references sibex.grupos (id);
alter table sibex.comandas  add column grupo_id bigint references sibex.grupos (id);

update sibex.movements m set grupo_id = sub.grupo_id
  from (
    select mi.movement_id, min(p.grupo_id) as grupo_id
    from sibex.movement_items mi join sibex.products p on p.id = mi.product_id
    where p.grupo_id is not null
    group by mi.movement_id
  ) sub
  where sub.movement_id = m.id;

update sibex.comandas c set grupo_id = m.grupo_id
  from sibex.movements m where m.id = c.movement_id and c.grupo_id is null;

-- Comandas sin movement_id (no debería pasar en Egreso Rápido, que siempre
-- crea uno) resuelven vía sus propios comanda_items.
update sibex.comandas c set grupo_id = sub.grupo_id
  from (
    select ci.comanda_id, min(p.grupo_id) as grupo_id
    from sibex.comanda_items ci join sibex.products p on p.id = ci.producto_id
    where ci.producto_id is not null and p.grupo_id is not null
    group by ci.comanda_id
  ) sub
  where sub.comanda_id = c.id and c.grupo_id is null;

-- Fallback para casos huérfanos (todas las líneas de ese movimiento/comanda
-- apuntan a productos ya sin categoría/grupo determinable, p.ej. de una
-- categoría borrada hace tiempo) — no debería quedar ninguno en uso real,
-- pero evita que el NOT NULL de abajo rompa la migración.
update sibex.movements set grupo_id = (select min(id) from sibex.grupos) where grupo_id is null;
update sibex.comandas  set grupo_id = (select min(id) from sibex.grupos) where grupo_id is null;

alter table sibex.movements alter column grupo_id set not null;
create index movements_grupo_id_idx on sibex.movements (grupo_id);
create index comandas_grupo_id_idx  on sibex.comandas  (grupo_id);


-- ══════════════════════════════════════════════════════════════════════════
--  2. category_grupos — M2M categoría↔grupo, reemplaza categories.grupo_id.
--     Backfill 1:1 (hoy cada categoría tiene exactamente un grupo).
-- ══════════════════════════════════════════════════════════════════════════

create table sibex.category_grupos (
  category_id  bigint not null references sibex.categories (id) on delete cascade,
  grupo_id     bigint not null references sibex.grupos (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (category_id, grupo_id)
);
create index category_grupos_grupo_id_idx on sibex.category_grupos (grupo_id);

insert into sibex.category_grupos (category_id, grupo_id)
  select id, grupo_id from sibex.categories;


-- ══════════════════════════════════════════════════════════════════════════
--  3. Fusión de categorías duplicadas por nombre (case-insensitive, trimmed)
--     — nuevo requisito de unicidad global. Hoy cada grupo tiene su propia
--     copia de nombres comunes ("Alimentos", etc.); esto las colapsa en una
--     sola fila por nombre, moviendo los vínculos de grupo, reasignando
--     products.category_id, y repunteando el área de cualquier coordinador
--     cuya área fuera la categoría perdedora.
-- ══════════════════════════════════════════════════════════════════════════

do $$
declare
  grp record;
  canon_id bigint;
  loser_id bigint;
begin
  for grp in
    select array_agg(id order by id) as ids
    from sibex.categories
    group by lower(btrim(nombre))
    having count(*) > 1
  loop
    canon_id := grp.ids[1];
    for loser_id in select unnest(grp.ids[2:array_length(grp.ids, 1)]) loop
      insert into sibex.category_grupos (category_id, grupo_id)
        select canon_id, grupo_id from sibex.category_grupos where category_id = loser_id
        on conflict (category_id, grupo_id) do nothing;
      delete from sibex.category_grupos where category_id = loser_id;

      update sibex.products set category_id = canon_id where category_id = loser_id;

      update auth.users
         set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{area}', to_jsonb(canon_id::text))
       where raw_app_meta_data ->> 'area' = loser_id::text;

      delete from sibex.categories where id = loser_id;
    end loop;
  end loop;
end $$;


-- ══════════════════════════════════════════════════════════════════════════
--  4. inventory.grupo_id — backfill desde products.grupo_id (todavía
--     intacto en este punto: 1 valor por producto, hoy 1:1 con inventory).
-- ══════════════════════════════════════════════════════════════════════════

alter table sibex.inventory add column grupo_id bigint references sibex.grupos (id);
alter table sibex.inventory add column deleted_at timestamptz;

update sibex.inventory i set grupo_id = p.grupo_id
  from sibex.products p where p.id = i.product_id;

-- Fallback para inventory de productos ya huérfanos (categoría borrada, sin
-- grupo determinable) — no debería quedar ninguno con conteo real en uso.
update sibex.inventory set grupo_id = (select min(id) from sibex.grupos) where grupo_id is null;


-- ══════════════════════════════════════════════════════════════════════════
--  5. Fusión de productos duplicados: mismo (category_id ya canónico,
--     nombre case-insensitive, unidad) repetido entre distintos grupos se
--     colapsa en un producto canónico, con una fila de inventory POR GRUPO
--     (sumando qnty si por algún motivo ya había más de una fila para el
--     mismo grupo) — mismo patrón que ya usa merge_product (mover
--     movement_items/comanda_items, soft-delete del perdedor).
-- ══════════════════════════════════════════════════════════════════════════

do $$
declare
  grp record;
  canon_id bigint;
  loser_id bigint;
  inv record;
begin
  for grp in
    select array_agg(id order by (deleted_at is not null), id) as ids
    from sibex.products
    where category_id is not null
    group by category_id, lower(btrim(name)), unidad
    having count(*) > 1
  loop
    canon_id := grp.ids[1];
    for loser_id in select unnest(grp.ids[2:array_length(grp.ids, 1)]) loop
      for inv in select * from sibex.inventory where product_id = loser_id loop
        if exists (select 1 from sibex.inventory where product_id = canon_id and grupo_id = inv.grupo_id) then
          update sibex.inventory set qnty = qnty + inv.qnty
            where product_id = canon_id and grupo_id = inv.grupo_id;
        else
          update sibex.inventory set product_id = canon_id
            where product_id = loser_id and grupo_id = inv.grupo_id;
        end if;
      end loop;
      delete from sibex.inventory where product_id = loser_id;

      update sibex.movement_items set product_id = canon_id where product_id = loser_id;
      update sibex.comanda_items set producto_id = canon_id where producto_id = loser_id;

      update sibex.products set deleted_at = coalesce(deleted_at, now()), updated_at = now() where id = loser_id;
    end loop;
  end loop;
end $$;


-- ══════════════════════════════════════════════════════════════════════════
--  6. Cambios de esquema — ahora que los datos ya son consistentes con las
--     reglas nuevas.
-- ══════════════════════════════════════════════════════════════════════════

-- 6.0 — objetos que dependen de categories.grupo_id y hay que quitar de en
-- medio ANTES del drop column: las policies viejas (referencian la columna
-- directamente) y can_access_category (function `language sql`, Postgres
-- registra su dependencia sobre la columna igual que en una vista). Se
-- redefine ya con su versión nueva (idéntica a la de la sección 8 más abajo
-- — queda duplicada ahí a propósito, sin costo, por si se corre esta
-- sección sola en un reintento).
drop policy if exists categories_select on sibex.categories;
drop policy if exists categories_admin_write on sibex.categories;

create or replace function sibex.can_access_category(p_category_id bigint) returns boolean
language sql stable as $$
  select sibex.is_super_admin()
      or (
        exists (
          select 1 from sibex.category_grupos cg
          where cg.category_id = p_category_id and cg.grupo_id = sibex.current_grupo_id()
        )
        and (
          sibex.current_role() = 'admin'
          or sibex.current_area() = 'general'
          or p_category_id = sibex.current_category_id()
        )
      )
$$;

-- 6.1 — categories: drop grupo_id, nombre único global.
do $$
declare fk text;
begin
  select conname into fk from pg_constraint
   where conrelid = 'sibex.categories'::regclass and contype = 'f' and confrelid = 'sibex.grupos'::regclass;
  if fk is not null then execute format('alter table sibex.categories drop constraint %I', fk); end if;
end $$;
do $$
declare uq text;
begin
  select conname into uq from pg_constraint
   where conrelid = 'sibex.categories'::regclass and contype = 'u';
  if uq is not null then execute format('alter table sibex.categories drop constraint %I', uq); end if;
end $$;
drop index if exists sibex.categories_grupo_id_idx;
alter table sibex.categories drop column grupo_id;
create unique index categories_nombre_unique_idx on sibex.categories (lower(btrim(nombre)));

-- 6.2 — products: drop grupo_id + su trigger de sincronización, unique
-- index nuevo (por categoría, no por grupo; parcial para permitir reusar el
-- nombre de un producto ya fusionado/soft-borrado).
drop trigger if exists trg_products_sync_grupo on sibex.products;
drop function if exists sibex.sync_product_grupo();
do $$
declare fk text;
begin
  select conname into fk from pg_constraint
   where conrelid = 'sibex.products'::regclass and contype = 'f' and confrelid = 'sibex.grupos'::regclass;
  if fk is not null then execute format('alter table sibex.products drop constraint %I', fk); end if;
end $$;
alter table sibex.products drop constraint if exists products_grupo_name_unidad_key;
drop index if exists sibex.products_grupo_id_idx;
alter table sibex.products drop column grupo_id;
create unique index products_category_name_unidad_unique_idx
  on sibex.products (category_id, lower(btrim(name)), unidad)
  where category_id is not null and deleted_at is null;

-- 6.3 — inventory: PK compuesta (product_id, grupo_id) — ya no hay
-- create_inventory_row automático (una fila ahora es "este grupo usa este
-- producto", se crea explícitamente vía add_product_to_grupo).
drop trigger if exists trg_products_create_inventory on sibex.products;
drop function if exists sibex.create_inventory_row();
alter table sibex.inventory drop constraint inventory_pkey;
alter table sibex.inventory alter column grupo_id set not null;
alter table sibex.inventory add primary key (product_id, grupo_id);
create index inventory_grupo_id_idx on sibex.inventory (grupo_id);

-- 6.4 — inventory.updated_at: el pull incremental del cliente pasa a ser
-- dos consultas (ver sección 16 más abajo, sync.js#_pull) — la segunda
-- necesita esta columna para detectar conteos que cambiaron SIN tocar el
-- producto. Mismo patrón genérico que ya usan products y el resto de
-- tablas con esta columna (sibex.set_updated_at(), ver sibex-schema-
-- install.sql sección 7.1).
alter table sibex.inventory add column if not exists updated_at timestamptz not null default now();
drop trigger if exists trg_inventory_updated_at on sibex.inventory;
create trigger trg_inventory_updated_at before update on sibex.inventory
  for each row execute function sibex.set_updated_at();


-- ══════════════════════════════════════════════════════════════════════════
--  7. Triggers de inventario — ahora resuelven la fila (product_id,
--     grupo_id) vía movements.grupo_id en vez de product_id solo.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.apply_movement_item() returns trigger
language plpgsql as $$
declare
  dir     sibex.movement_direction;
  v_grupo bigint;
  budget  integer;
  r       record;
begin
  select direction, grupo_id into dir, v_grupo from sibex.movements where id = new.movement_id;

  if dir = 'in' then
    update sibex.inventory set qnty = qnty + new.qnty where product_id = new.product_id and grupo_id = v_grupo;

    -- `requests` queda fuera del alcance de este cambio (tabla sin uso hoy
    -- en la app, ver PENDIENTE-migracion — no se le agrega grupo_id).
    budget := new.qnty;
    for r in
      select id, qnty_outstanding from sibex.requests
       where product_id = new.product_id and status = 'open'
       order by requested_at, id
    loop
      exit when budget <= 0;
      if r.qnty_outstanding <= budget then
        update sibex.requests set qnty_outstanding = 0, status = 'fulfilled' where id = r.id;
        budget := budget - r.qnty_outstanding;
      else
        update sibex.requests set qnty_outstanding = qnty_outstanding - budget where id = r.id;
        budget := 0;
      end if;
    end loop;
  else
    update sibex.inventory set qnty = qnty - new.qnty where product_id = new.product_id and grupo_id = v_grupo;
  end if;

  return new;
end;
$$;

create or replace function sibex.apply_movement_item_changes() returns trigger
language plpgsql as $$
declare dir sibex.movement_direction; v_grupo bigint;
begin
  if tg_op = 'DELETE' then
    select direction, grupo_id into dir, v_grupo from sibex.movements where id = old.movement_id;
    if v_grupo is null then return old; end if; -- movimiento padre ya no resoluble (no debería pasar)
    if dir = 'in' then
      update sibex.inventory set qnty = qnty - old.qnty where product_id = old.product_id and grupo_id = v_grupo;
    else
      update sibex.inventory set qnty = qnty + old.qnty where product_id = old.product_id and grupo_id = v_grupo;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.qnty <> old.qnty then
      select direction, grupo_id into dir, v_grupo from sibex.movements where id = new.movement_id;
      if dir = 'in' then
        update sibex.inventory set qnty = qnty + (new.qnty - old.qnty) where product_id = new.product_id and grupo_id = v_grupo;
      else
        update sibex.inventory set qnty = qnty - (new.qnty - old.qnty) where product_id = new.product_id and grupo_id = v_grupo;
      end if;
    end if;
    return new;
  end if;

  return null;
end;
$$;


-- ══════════════════════════════════════════════════════════════════════════
--  8. can_access_category — único cambio conceptual: "mi grupo" pasa de
--     "la categoría es de mi grupo" a "mi grupo vinculó esta categoría"
--     (category_grupos). Esto es lo único que hace falta para que TODA
--     policy/RPC que ya la llama vea correctamente el catálogo compartido —
--     pero ya NO implica "puedo tocar el conteo de este grupo para este
--     producto": eso ahora exige además can_access_grupo() sobre la fila
--     concreta (inventory/movements/comandas), porque una categoría puede
--     estar vinculada a más de un grupo.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.can_access_category(p_category_id bigint) returns boolean
language sql stable as $$
  select sibex.is_super_admin()
      or (
        exists (
          select 1 from sibex.category_grupos cg
          where cg.category_id = p_category_id and cg.grupo_id = sibex.current_grupo_id()
        )
        and (
          sibex.current_role() = 'admin'
          or sibex.current_area() = 'general'
          or p_category_id = sibex.current_category_id()
        )
      )
$$;


-- ══════════════════════════════════════════════════════════════════════════
--  9. CATEGORÍAS — create_category ahora busca-y-reutiliza (case-insensitive)
--     antes de crear; delete_category pasa a ser "desvincular de MI grupo"
--     (borra la categoría real solo si queda sin ningún grupo vinculado).
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

  -- Reutiliza una categoría ya existente con el mismo nombre (de cualquier
  -- grupo) en vez de duplicar — catálogo compartido, evita repetidos.
  select id into v_id from sibex.categories where lower(nombre) = lower(v_nombre);
  if v_id is null then
    insert into sibex.categories (nombre) values (v_nombre) returning id into v_id;
  end if;

  insert into sibex.category_grupos (category_id, grupo_id) values (v_id, v_grupo)
    on conflict (category_id, grupo_id) do nothing;

  return v_id;
end;
$$;
grant execute on function sibex.create_category(text, bigint) to authenticated;

-- update_category: sin cambios de fondo (el índice único nuevo hace de
-- guardarraíl si el nuevo nombre colisiona con otra categoría existente).

create or replace function sibex.delete_category(p_id bigint, p_force boolean default false, p_grupo_id bigint default null) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_grupo bigint;
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede eliminar categorías';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;
  if not sibex.can_access_category(p_id) then
    raise exception 'No tienes permiso para eliminar esta categoría';
  end if;
  if not exists (select 1 from sibex.category_grupos where category_id = p_id and grupo_id = v_grupo) then
    raise exception 'Esta categoría no está vinculada a tu grupo';
  end if;

  -- Solo conteos VIVOS (no soft-borrados) de ESTE grupo bloquean — uno
  -- soft-borrado ya no cuenta como "en uso" (mismo criterio que ya usaba
  -- delete_category con products.deleted_at, ahora sobre inventory.deleted_at).
  if exists (
    select 1 from sibex.inventory i join sibex.products p on p.id = i.product_id
    where p.category_id = p_id and i.grupo_id = v_grupo and i.deleted_at is null
  ) then
    if not p_force then
      raise exception 'Hay insumos con conteo en esta categoría para tu grupo — usa la opción de forzar para eliminarlos también';
    end if;
    update sibex.inventory i set deleted_at = now()
      from sibex.products p
     where i.product_id = p.id and p.category_id = p_id and i.grupo_id = v_grupo and i.deleted_at is null;
  end if;

  update auth.users
     set raw_app_meta_data = raw_app_meta_data - 'role' - 'area'
   where raw_app_meta_data ->> 'area' = p_id::text
     and (raw_app_meta_data ->> 'grupo_id')::bigint = v_grupo;

  delete from sibex.category_grupos where category_id = p_id and grupo_id = v_grupo;

  -- Categoría sin ningún grupo vinculado: limpieza de huérfana.
  if not exists (select 1 from sibex.category_grupos where category_id = p_id) then
    delete from sibex.categories where id = p_id;
  end if;
end;
$$;
grant execute on function sibex.delete_category(bigint, boolean, bigint) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  9b. update_grupo — un admin normal ya puede editar (renombrar) SU PROPIO
--      grupo desde "Editar mi grupo" (antes era estrictamente super_admin-
--      only). super_admin sigue pudiendo editar cualquier grupo.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.update_grupo(p_id bigint, p_nombre text) returns void
language plpgsql security definer set search_path = sibex as $$
begin
  if not (sibex.is_admin() and sibex.can_access_grupo(p_id)) then
    raise exception 'No tienes permiso para editar este grupo de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre del grupo es obligatorio';
  end if;
  update sibex.grupos set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Grupo % no existe', p_id; end if;
end;
$$;
grant execute on function sibex.update_grupo(bigint, text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  10. add_product_to_grupo — encuentra-o-crea un producto compartido en la
--      categoría y adjunta/revive el conteo (inventory) de MI grupo,
--      registrando el conteo inicial vía movimiento igual que apply_count
--      (Bitácora auditada). Reemplaza el upsert directo por REST que hacía
--      sync.js para productos nuevos.
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

  -- Reutiliza un producto VIVO ya existente en esta categoría por
  -- nombre+unidad (catálogo compartido entre grupos) — evita duplicados.
  -- Alias/calificados a propósito (fix 2026-08-28): products/inventory
  -- tienen columnas (client_id/name/qnty/product_id) que coinciden con las
  -- salidas OUT de esta función (returns table(...)) — PL/pgSQL las toma
  -- por esas variables si quedan sin calificar y tira "column reference
  -- ... is ambiguous" (42702).
  select pr.id, pr.client_id into v_pid, v_client_id
    from sibex.products pr
   where pr.category_id = p_category_id and pr.unidad = v_unidad
     and lower(btrim(pr.name)) = lower(v_name) and pr.deleted_at is null;

  if v_pid is null then
    insert into sibex.products (client_id, name, unidad, category_id, umbral, umbral_max)
      values (p_client_id, v_name, v_unidad, p_category_id, coalesce(p_umbral, 10), p_umbral_max)
      returning products.id, products.client_id into v_pid, v_client_id;
  end if;

  insert into sibex.inventory (product_id, grupo_id, qnty)
    values (v_pid, v_grupo, 0)
    on conflict (product_id, grupo_id) do update set deleted_at = null
    where inventory.deleted_at is not null;

  -- Idempotencia: reintento con el mismo client_op_id devuelve el estado ya aplicado.
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


-- ══════════════════════════════════════════════════════════════════════════
--  11. remove_product_from_grupo — soft-delete SOLO del conteo (inventory)
--      de mi grupo. No toca el producto ni el historial de movimientos.
--      "Restaurar" = volver a agregar el mismo producto vía
--      add_product_to_grupo (revive la fila).
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.remove_product_from_grupo(p_product_client_id text, p_grupo_id bigint default null) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint; v_grupo bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then return; end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  update sibex.inventory set deleted_at = now()
   where product_id = v_pid and grupo_id = v_grupo and deleted_at is null;
end;
$$;
grant execute on function sibex.remove_product_from_grupo(text, bigint) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  12. CONTEO DE INVENTARIO — apply_count/uncount_item/delete_count ganan
--      resolución de grupo (mismo patrón p_grupo_id que create_category) y
--      operan sobre la fila (product_id, grupo_id) en vez de product_id solo.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.apply_count(
  p_client_op_id       text,
  p_product_client_id  text,
  p_delta              integer,
  p_origen             text,
  p_grupo_id           bigint default null
) returns integer
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint; v_grupo bigint; v_mid bigint; v_qty integer; v_ci bigint; v_tipo text;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  if p_origen not in ('ingreso', 'conteo') then
    raise exception 'Origen inválido: debe ser ingreso o conteo';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
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
  if not exists (select 1 from sibex.inventory where product_id = v_pid and grupo_id = v_grupo) then
    raise exception 'Este insumo no está vinculado a tu grupo de extensión';
  end if;

  if p_client_op_id is not null and exists (
    select 1 from sibex.movements where client_op_id = p_client_op_id
  ) then
    select qnty into v_qty from sibex.inventory where product_id = v_pid and grupo_id = v_grupo;
    return v_qty;
  end if;

  if p_delta <> 0 then
    insert into sibex.movements (direction, note, client_op_id, delivered_by, grupo_id)
      values (
        case when p_delta > 0 then 'in'::sibex.movement_direction else 'out'::sibex.movement_direction end,
        sibex.actor_note(v_tipo), p_client_op_id, v_ci, v_grupo
      ) returning id into v_mid;

    insert into sibex.movement_items (movement_id, product_id, qnty)
      values (v_mid, v_pid, abs(p_delta));
  end if;

  update sibex.inventory
     set last_counted_at = now(),
         last_counted_by = coalesce((select name || ' ' || surname from sibex.persons where ci = v_ci), last_counted_by)
   where product_id = v_pid and grupo_id = v_grupo;

  select qnty into v_qty from sibex.inventory where product_id = v_pid and grupo_id = v_grupo;
  return v_qty;
end;
$$;
grant execute on function sibex.apply_count(text, text, integer, text, bigint) to authenticated;

create or replace function sibex.uncount_item(p_product_client_id text, p_grupo_id bigint default null) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_pid bigint; v_cat bigint; v_grupo bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  select id, category_id into v_pid, v_cat from sibex.products where client_id = p_product_client_id;
  if v_pid is null then return; end if;
  if not sibex.can_access_category(v_cat) then
    raise exception 'No tienes permiso para modificar insumos de esta categoría';
  end if;

  delete from sibex.movements
   where grupo_id = v_grupo
     and id in (select movement_id from sibex.movement_items where product_id = v_pid);

  update sibex.inventory
     set qnty = 0, last_counted_at = null, last_counted_by = null
   where product_id = v_pid and grupo_id = v_grupo;
end;
$$;
grant execute on function sibex.uncount_item(text, bigint) to authenticated;

create or replace function sibex.delete_count(p_client_op_id text) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_mid bigint; v_grupo bigint; v_product_ids bigint[];
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para modificar el inventario';
  end if;

  select id, grupo_id into v_mid, v_grupo from sibex.movements where client_op_id = p_client_op_id;
  if v_mid is null then return; end if;
  if not sibex.can_access_grupo(v_grupo) then
    raise exception 'No tienes permiso para modificar movimientos de este grupo';
  end if;

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
      where mi.product_id = i.product_id and m.grupo_id = i.grupo_id),
    last_counted_by = (
      select m.note from sibex.movements m
      join sibex.movement_items mi on mi.movement_id = m.id
      where mi.product_id = i.product_id and m.grupo_id = i.grupo_id
      order by m.occurred_at desc limit 1)
  where i.product_id = any(v_product_ids) and i.grupo_id = v_grupo;
end;
$$;
grant execute on function sibex.delete_count(text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  13. merge_product — fusiona TODAS las filas de inventory del origen (por
--      cada grupo: suma si el destino ya tiene fila para ese grupo, si no
--      repunta) — sigue siendo una operación de catálogo compartido: si la
--      categoría está vinculada a más de un grupo, puede afectar el conteo
--      de otro grupo (consistente con "catálogo compartido y estandarizado").
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.merge_product(
  p_source_client_id text, p_target_client_id text
) returns void
language plpgsql security definer set search_path = sibex as $$
declare v_source bigint; v_target bigint; v_source_cat bigint; v_target_cat bigint; r record;
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

  for r in select * from sibex.inventory where product_id = v_source loop
    if exists (select 1 from sibex.inventory where product_id = v_target and grupo_id = r.grupo_id) then
      update sibex.inventory set qnty = qnty + r.qnty where product_id = v_target and grupo_id = r.grupo_id;
    else
      update sibex.inventory set product_id = v_target where product_id = v_source and grupo_id = r.grupo_id;
    end if;
  end loop;
  delete from sibex.inventory where product_id = v_source;

  update sibex.movement_items set product_id = v_target where product_id = v_source;
  update sibex.comanda_items set producto_id = v_target where producto_id = v_source;
  update sibex.products set deleted_at = now(), updated_at = now() where id = v_source;
end;
$$;
grant execute on function sibex.merge_product(text, text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  14. EGRESO RÁPIDO / DESPACHOS — grupo-aware. Se aprovecha para sumar
--      'super_admin' a los chequeos de rol (hoy solo admin/coordinador),
--      mismo criterio que el patch 2026-08-24 ya aplicó a apply_count/
--      uncount_item/delete_count/merge_product — sin esto, un super_admin
--      no podría usar Egreso Rápido/Despachos en ningún grupo.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.create_comanda_rapida(
  p_solicitante_ci  bigint,
  p_items           jsonb,
  p_client_op_id    text default null,
  p_note            text default null,
  p_grupo_id        bigint default null
) returns table(comanda_id bigint, movement_id bigint)
language plpgsql security definer set search_path = sibex as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text; v_autorizado_por text; v_grupo bigint;
  v_comanda_id bigint; v_movement_id bigint;
  v_expected int; v_inserted int;
  v_pid bigint; v_pname text; v_punidad text; v_pcat bigint; v_qty int; v_disponible int;
  v_item jsonb;
begin
  v_role := sibex.current_role();
  v_ci := sibex.current_person_ci();
  if v_role not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para registrar una entrega';
  end if;
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  if p_client_op_id is not null then
    select c.id into v_comanda_id from sibex.comandas c where c.client_op_id = p_client_op_id;
    if found then
      select m.id into v_movement_id from sibex.movements m where m.client_op_id = p_client_op_id;
      return query select v_comanda_id, v_movement_id;
      return;
    end if;
  end if;

  if p_solicitante_ci is not null and not exists (select 1 from sibex.persons where ci = p_solicitante_ci) then
    raise exception 'El solicitante no existe';
  end if;

  v_expected := jsonb_array_length(p_items);
  if v_expected is null or v_expected = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select (name || ' ' || surname) into v_actor_nombre from sibex.persons where ci = v_ci;
  v_autorizado_por := v_actor_nombre || ' (Uso Interno)';

  insert into sibex.comandas (
    solicitante_ci, estudiante_resp_ci, responsable_entrega_ci,
    aprobado_por_ci, aprobado_por, created_by_ci, created_by,
    fecha, hora_salida, hora_llegada,
    status, origen, processed_at, notas, client_op_id, autorizado_por, grupo_id
  ) values (
    p_solicitante_ci, v_ci, v_ci,
    v_ci, v_actor_nombre, v_ci, v_actor_nombre,
    current_date, current_time, current_time,
    'completada', 'rapida', now(), p_note, p_client_op_id, v_autorizado_por, v_grupo
  ) returning id into v_comanda_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'qnty')::int;

    if v_pid is null or v_qty is null or v_qty <= 0 then
      raise exception 'Ítem inválido en el carrito (producto o cantidad faltante)';
    end if;

    select p.name, p.unidad, p.category_id into v_pname, v_punidad, v_pcat
      from sibex.products p where p.id = v_pid and p.deleted_at is null;
    if not found then
      raise exception 'Producto % no existe o fue eliminado', v_pid;
    end if;
    if not sibex.can_access_category(v_pcat) then
      raise exception 'No tienes permiso para egresar insumos de esta categoría (%)', v_pname;
    end if;

    select qnty into v_disponible from sibex.inventory where product_id = v_pid and grupo_id = v_grupo for update;
    if v_disponible is null or v_disponible < v_qty then
      raise exception 'No hay suficiente disponibilidad de "%" (disponible: %, solicitado: %)',
        v_pname, coalesce(v_disponible, 0), v_qty;
    end if;

    insert into sibex.comanda_items (comanda_id, producto, producto_id, cantidad, unidad)
      values (v_comanda_id, v_pname, v_pid, v_qty, v_punidad);
  end loop;

  insert into sibex.movements (direction, note, client_op_id, occurred_at, delivered_by, grupo_id)
    values ('out', sibex.actor_note('Egreso'), p_client_op_id, now(), v_ci, v_grupo)
    returning id into v_movement_id;

  update sibex.comandas set movement_id = v_movement_id where id = v_comanda_id;

  insert into sibex.movement_items (movement_id, product_id, qnty)
    select v_movement_id, (elem->>'product_id')::bigint, (elem->>'qnty')::int
    from jsonb_array_elements(p_items) elem;
  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'create_comanda_rapida: % de % líneas no coincidieron con products', (v_expected - v_inserted), v_expected;
  end if;

  update sibex.products up set updated_at = now()
   where up.id in (select (elem->>'product_id')::bigint from jsonb_array_elements(p_items) elem);

  return query select v_comanda_id, v_movement_id;
end;
$$;
grant execute on function sibex.create_comanda_rapida(bigint, jsonb, text, text, bigint) to authenticated;

create or replace function sibex.list_despachos_pendientes() returns table(
  item_id        bigint,
  comanda_id     integer,
  producto       text,
  cantidad       numeric,
  unidad         text,
  category_id    bigint,
  solicitante    text,
  solicitado_en  timestamptz
)
language plpgsql security definer set search_path = sibex as $$
declare v_role text;
begin
  v_role := sibex.current_role();
  if v_role not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para ver despachos';
  end if;

  return query
    select
      ci.id::bigint, c.id::integer, ci.producto::text, ci.cantidad::numeric, ci.unidad::text, pr.category_id,
      coalesce(sp.name || ' ' || sp.surname, 'Sin solicitante')::text,
      c.created_at::timestamptz
    from sibex.comanda_items ci
    join sibex.comandas c on c.id = ci.comanda_id
    join sibex.products pr on pr.id = ci.producto_id
    left join sibex.persons sp on sp.ci = c.solicitante_ci
    where ci.despachado = false
      and c.status = 'por_despachar'
      and c.deleted_at is null
      and sibex.can_access_category(pr.category_id)
      and sibex.can_access_grupo(c.grupo_id)
    order by c.created_at asc;
end;
$$;
grant execute on function sibex.list_despachos_pendientes() to authenticated;

create or replace function sibex.marcar_despacho_entregado(p_item_id bigint) returns void
language plpgsql security definer set search_path = sibex as $$
declare
  v_role text; v_ci bigint; v_actor_nombre text;
  v_categoria bigint; v_comanda_id integer; v_comanda_grupo bigint;
  v_comanda_status sibex.comanda_status; v_pendientes integer;
begin
  v_role := sibex.current_role();
  v_ci := sibex.current_person_ci();
  if v_role not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para marcar despachos';
  end if;

  select name || ' ' || surname into v_actor_nombre from sibex.persons where ci = v_ci;

  select pr.category_id, ci.comanda_id, c.status, c.grupo_id
    into v_categoria, v_comanda_id, v_comanda_status, v_comanda_grupo
  from sibex.comanda_items ci
  join sibex.products pr on pr.id = ci.producto_id
  join sibex.comandas c on c.id = ci.comanda_id
  where ci.id = p_item_id
  for update of ci;

  if v_comanda_id is null then
    raise exception 'Ítem de comanda no encontrado (o no pertenece a un producto del catálogo).';
  end if;
  if not sibex.can_access_category(v_categoria) or not sibex.can_access_grupo(v_comanda_grupo) then
    raise exception 'No tienes permiso para despachar ítems de esta área.';
  end if;
  if v_comanda_status <> 'por_despachar' then
    raise exception 'Esta comanda ya no está pendiente de despacho.';
  end if;

  update sibex.comanda_items
     set despachado = true, despachado_por_ci = v_ci, despachado_por = v_actor_nombre, despachado_at = now()
   where id = p_item_id and despachado = false;

  select count(*) into v_pendientes
    from sibex.comanda_items
   where comanda_id = v_comanda_id and producto_id is not null and despachado = false;

  if v_pendientes = 0 then
    update sibex.comandas set status = 'despachada' where id = v_comanda_id;
  end if;
end;
$$;
grant execute on function sibex.marcar_despacho_entregado(bigint) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  15. ROW LEVEL SECURITY — categories (lectura global para el buscador),
--      category_grupos (nueva), inventory/movements/movement_items/
--      comandas/comanda_items (agregan chequeo de grupo de la fila).
--
--  movement_grupo()/comanda_grupo() (fix 2026-08-28): movement_items_select
--  y comanda_items_select necesitan el grupo_id de su fila padre
--  (movements/comandas) para el chequeo de can_access_grupo. Leerlo con un
--  EXISTS directo contra esas tablas dispara SU RLS, que a su vez vuelve a
--  consultar movement_items/comanda_items (movements_select/comandas_select
--  ya lo hacían desde antes) — dos policies referenciándose entre sí en
--  ambas direcciones y Postgres no puede resolver la expansión ("infinite
--  recursion detected in policy for relation ..."), que PostgREST devuelve
--  como 500 en cualquier query que haga JOIN entre las dos tablas (p.ej.
--  Historial de Ingresos/Egresos). Mismo patrón que current_person_ci()
--  más arriba (lee sibex.persons sin pasar por su RLS): security definer
--  rompe el ciclo porque corre como el dueño de la función, exento de RLS.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.movement_grupo(p_movement_id bigint) returns bigint
language sql stable security definer set search_path = sibex as $$
  select grupo_id from sibex.movements where id = p_movement_id
$$;

create or replace function sibex.comanda_grupo(p_comanda_id bigint) returns bigint
language sql stable security definer set search_path = sibex as $$
  select grupo_id from sibex.comandas where id = p_comanda_id
$$;

alter table sibex.category_grupos enable row level security;
create policy category_grupos_select on sibex.category_grupos for select
  to authenticated using (true);
grant select on sibex.category_grupos to authenticated;
grant select, insert, update, delete on sibex.category_grupos to service_role;

-- Ya se dropearon en la sección 6.0 (tenían que irse antes del drop column
-- de categories.grupo_id) — acá solo quedan por crear las nuevas.
create policy categories_select on sibex.categories for select
  to authenticated using (true);
create policy categories_admin_insert on sibex.categories for insert
  to authenticated with check (sibex.is_admin());
create policy categories_admin_update on sibex.categories for update
  to authenticated using (sibex.is_admin()) with check (sibex.is_admin());
-- El DELETE directo por REST queda bloqueado a propósito: la limpieza de
-- categorías huérfanas vive solo dentro de delete_category (chequea conteos
-- vivos y desvincula, no un DELETE sin criterio).
revoke delete on sibex.categories from authenticated;

drop policy inventory_select on sibex.inventory;
create policy inventory_select on sibex.inventory for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = inventory.product_id and sibex.can_access_category(p.category_id))
    and sibex.can_access_grupo(inventory.grupo_id)
  );

drop policy movements_select on sibex.movements;
create policy movements_select on sibex.movements for select
  to authenticated using (
    sibex.can_access_grupo(movements.grupo_id)
    and exists (
      select 1 from sibex.movement_items mi join sibex.products p on p.id = mi.product_id
      where mi.movement_id = movements.id and sibex.can_access_category(p.category_id)
    )
  );

drop policy movement_items_select on sibex.movement_items;
create policy movement_items_select on sibex.movement_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = movement_items.product_id and sibex.can_access_category(p.category_id))
    and sibex.can_access_grupo(sibex.movement_grupo(movement_items.movement_id))
  );

drop policy comandas_select on sibex.comandas;
create policy comandas_select on sibex.comandas for select
  to authenticated using (
    sibex.can_access_grupo(comandas.grupo_id)
    and exists (
      select 1 from sibex.comanda_items ci join sibex.products p on p.id = ci.producto_id
      where ci.comanda_id = comandas.id and sibex.can_access_category(p.category_id)
    )
  );

drop policy comanda_items_select on sibex.comanda_items;
create policy comanda_items_select on sibex.comanda_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = comanda_items.producto_id and sibex.can_access_category(p.category_id))
    and sibex.can_access_grupo(sibex.comanda_grupo(comanda_items.comanda_id))
  );
