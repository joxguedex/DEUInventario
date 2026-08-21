-- ══════════════════════════════════════════════════════════════════════════
--  Grupos de extensión (multi-tenant) — SIBEX UCV
-- ------------------------------------------------------------------------
--  Varios grupos de extensión usan el mismo sistema, cada uno con su propio
--  inventario/usuarios/comunicados/directorio, sin ver el de los demás.
--  Nuevo rol `super_admin`: ve todo, todos los grupos. `admin` pasa de
--  "ve todo el sistema" a "ve todo SU grupo" (mismo criterio que ya tenía
--  un coordinador de 'general' respecto de las categorías, un nivel más
--  arriba). Pegar entero en el SQL Editor de Supabase. Reflejado también en
--  `new-project-schema.sql` para que un fresh install quede igual (ver
--  documentation/08-base-de-datos-PENDIENTE.md).
-- ══════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════
--  1. TABLA `grupos`
-- ══════════════════════════════════════════════════════════════════════════

create table public.grupos (
  id          bigint generated always as identity primary key,
  nombre      text not null unique check (char_length(trim(nombre)) > 0 and char_length(nombre) <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_grupos_updated_at before update on public.grupos
  for each row execute function public.set_updated_at();

-- Grupo por defecto: recibe todo lo que ya existe en la base (backfill de
-- categories/persons/comms/products más abajo). Renombrarlo desde el panel
-- "Grupos de extensión" (o con un UPDATE) una vez migrado.
insert into public.grupos (nombre) values ('Sin asignar');


-- ══════════════════════════════════════════════════════════════════════════
--  2. `grupo_id` en categories / persons / comms / products
-- ══════════════════════════════════════════════════════════════════════════

-- 2.1 — categories: cada categoría pertenece a un solo grupo. Es el punto
-- central — products/inventory/movements/movement_items/requests/comandas/
-- comanda_items ya resuelven su alcance vía can_access_category(category_id),
-- así que basta con que esa función valide también el grupo (sección 4) para
-- que todas hereden el aislamiento sin tocarlas una por una.
alter table public.categories add column grupo_id bigint;
update public.categories set grupo_id = (select id from public.grupos where nombre = 'Sin asignar');
alter table public.categories alter column grupo_id set not null;
alter table public.categories add constraint categories_grupo_id_fkey
  foreign key (grupo_id) references public.grupos (id);
alter table public.categories drop constraint categories_nombre_key;
alter table public.categories add constraint categories_grupo_nombre_key unique (grupo_id, nombre);
create index categories_grupo_id_idx on public.categories (grupo_id);

-- 2.2 — persons: directorio (buscador de Egreso Rápido/Despachos, etc.)
-- separado por grupo — decisión explícita: un coordinador de un grupo no
-- debe ver nombres/teléfonos de personas de otro grupo.
alter table public.persons add column grupo_id bigint;
update public.persons set grupo_id = (select id from public.grupos where nombre = 'Sin asignar');
alter table public.persons alter column grupo_id set not null;
alter table public.persons add constraint persons_grupo_id_fkey
  foreign key (grupo_id) references public.grupos (id);
create index persons_grupo_id_idx on public.persons (grupo_id);

-- 2.3 — comms (Comunicados): separados por grupo — decisión explícita.
alter table public.comms add column grupo_id bigint;
update public.comms set grupo_id = (select id from public.grupos where nombre = 'Sin asignar');
alter table public.comms alter column grupo_id set not null;
alter table public.comms add constraint comms_grupo_id_fkey
  foreign key (grupo_id) references public.grupos (id);
create index comms_grupo_id_idx on public.comms (grupo_id);

-- 2.4 — products: grupo_id DENORMALIZADO (no solo derivable vía category_id)
-- porque `products_name_unidad_key unique(name, unidad)` es hoy GLOBAL — sin
-- esto, dos grupos no podrían tener ambos un insumo "Arroz / kg". Se
-- mantiene sincronizado con la categoría del producto vía trigger (mismo
-- patrón que create_inventory_row en la sección 7 del esquema base) — el
-- cliente sigue sin tener que enviar grupo_id nunca, solo category_id como
-- ya hace.
alter table public.products add column grupo_id bigint;

create or replace function public.sync_product_grupo() returns trigger
language plpgsql as $$
begin
  new.grupo_id := (select grupo_id from public.categories where id = new.category_id);
  return new;
end;
$$;
create trigger trg_products_sync_grupo
  before insert or update of category_id on public.products
  for each row execute function public.sync_product_grupo();

-- Backfill: dispara el trigger a mano para los productos ya existentes
-- (un producto sin category_id — soft-borrado y desvinculado, ver
-- delete_category — se queda con grupo_id null, no cuenta para la unique).
update public.products set category_id = category_id;

alter table public.products drop constraint products_name_unidad_key;
alter table public.products add constraint products_grupo_name_unidad_key unique (grupo_id, name, unidad);
create index products_grupo_id_idx on public.products (grupo_id);


-- ══════════════════════════════════════════════════════════════════════════
--  3. Helpers de rol/grupo (sección 8 del esquema base) — van ANTES que la
--     RLS de `grupos` (sección 4): is_super_admin() todavía no existe hasta
--     acá, y la policy de abajo ya la necesita.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.current_grupo_id() returns bigint
language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'grupo_id', '')::bigint
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable as $$
  select public.current_role() = 'super_admin'
$$;

-- is_admin() pasa a incluir super_admin: así todo lo que hoy usa is_admin()
-- como gate de ROL (no de alcance) sigue funcionando para super_admin sin
-- tocarlo — el límite real de A QUÉ FILAS llega queda en can_access_grupo()/
-- can_access_category() y en las policies/RPCs que además comparan grupo_id.
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select public.current_role() in ('admin', 'super_admin')
$$;

-- ¿Puede el actor actual tocar datos de este grupo? super_admin: siempre.
-- admin/coordinador: solo el suyo propio (current_grupo_id(), del JWT).
create or replace function public.can_access_grupo(p_grupo_id bigint) returns boolean
language sql stable as $$
  select public.is_super_admin() or public.current_grupo_id() = p_grupo_id
$$;

-- Extiende el chequeo de categoría existente con el de grupo — un solo
-- cambio acá se propaga a TODA policy/RPC que ya llama can_access_category()
-- (products, inventory, movements, movement_items, requests, comandas,
-- comanda_items, merge_product, apply_count, uncount_item, delete_count...).
create or replace function public.can_access_category(p_category_id bigint) returns boolean
language sql stable as $$
  select public.is_super_admin()
      or (
        public.can_access_grupo((select grupo_id from public.categories where id = p_category_id))
        and (
          public.current_role() = 'admin'
          or public.current_area() = 'general'
          or p_category_id = public.current_category_id()
        )
      )
$$;


-- ══════════════════════════════════════════════════════════════════════════
--  4. RLS de `grupos`
-- ══════════════════════════════════════════════════════════════════════════

alter table public.grupos enable row level security;
-- Lectura abierta a cualquier sesión (hace falta para poblar el switcher de
-- grupo y los selects de "crear usuario" — igual criterio que categories
-- hoy). Nombres de grupo no son información sensible.
create policy grupos_select on public.grupos for select
  to authenticated using (true);
create policy grupos_super_admin_write on public.grupos for all
  to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
grant select, insert, update on public.grupos to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  5. RLS — categories / persons / phones / comms se vuelven grupo-conscientes
--     (no las cubre can_access_category porque ESTAS tablas definen el
--     grupo, no lo heredan de una categoría)
-- ══════════════════════════════════════════════════════════════════════════

drop policy categories_select on public.categories;
drop policy categories_admin_write on public.categories;
create policy categories_select on public.categories for select
  to authenticated using (public.can_access_grupo(grupo_id));
create policy categories_admin_write on public.categories for all
  to authenticated
  using (public.is_admin() and public.can_access_grupo(grupo_id))
  with check (public.is_admin() and public.can_access_grupo(grupo_id));

drop policy persons_select on public.persons;
drop policy persons_admin_write on public.persons;
create policy persons_select on public.persons for select
  to authenticated using (public.can_access_grupo(grupo_id));
create policy persons_admin_write on public.persons for all
  to authenticated
  using (public.is_admin() and public.can_access_grupo(grupo_id))
  with check (public.is_admin() and public.can_access_grupo(grupo_id));

drop policy phones_select on public.phones;
create policy phones_select on public.phones for select
  to authenticated using (
    public.is_super_admin()
    or exists (select 1 from public.persons p where p.phone_id = phones.id and p.grupo_id = public.current_grupo_id())
  );

drop policy comms_select on public.comms;
drop policy comms_insert on public.comms;
drop policy comms_update on public.comms;
create policy comms_select on public.comms for select
  to authenticated using (public.can_access_grupo(grupo_id));
create policy comms_insert on public.comms for insert
  to authenticated with check (public.can_access_grupo(grupo_id));
create policy comms_update on public.comms for update
  to authenticated using (public.can_access_grupo(grupo_id)) with check (public.can_access_grupo(grupo_id));

-- movements_select/comandas_select tenían un atajo directo "is_admin() or
-- current_area()='general'" que ahora sería un bug: is_admin() pasó a
-- incluir super_admin PERO también sigue siendo cierto para un admin de
-- grupo — ese atajo le dejaría ver movimientos/comandas de CUALQUIER grupo,
-- no solo el suyo. can_access_category() ya cubre admin/general/coordinador
-- por dentro (sección 3), así que el exists() alcanza solo con eso — todo
-- movimiento tiene ≥1 línea garantizado por el trigger movement_has_items.
drop policy movements_select on public.movements;
create policy movements_select on public.movements for select
  to authenticated using (
    exists (
      select 1 from public.movement_items mi join public.products p on p.id = mi.product_id
      where mi.movement_id = movements.id and public.can_access_category(p.category_id)
    )
  );

-- Mismo problema en products_insert/products_update: el atajo "is_admin()
-- or ..." dejaba crear/editar un producto en la categoría de OTRO grupo sin
-- chequeo alguno. can_access_category() sola ya cubre admin/general/
-- coordinador correctamente (y preserva exactamente el mismo comportamiento
-- de antes para los demás casos, incluida la laxitud ya existente de
-- 'general' — no se toca eso acá, no es parte de este cambio).
drop policy products_insert on public.products;
drop policy products_update on public.products;
create policy products_insert on public.products for insert
  to authenticated with check (public.can_access_category(category_id));
create policy products_update on public.products for update
  to authenticated
  using (public.can_access_category(category_id))
  with check (public.can_access_category(category_id));

drop policy comandas_select on public.comandas;
create policy comandas_select on public.comandas for select
  to authenticated using (
    exists (
      select 1 from public.comanda_items ci join public.products p on p.id = ci.producto_id
      where ci.comanda_id = comandas.id and public.can_access_category(p.category_id)
    )
  );


-- ══════════════════════════════════════════════════════════════════════════
--  6. RPCs — categorías, ahora grupo-conscientes
-- ══════════════════════════════════════════════════════════════════════════

-- CREATE OR REPLACE no alcanza acá: p_grupo_id es un parámetro NUEVO, así
-- que sin este DROP quedarían DOS funciones sobrecargadas (la vieja
-- create_category(text), sin ningún chequeo de grupo, seguiría siendo
-- llamable — y fallaría igual por el NOT NULL de categories.grupo_id, pero
-- mejor no dejar el artefacto suelto).
drop function if exists public.create_category(text);
create or replace function public.create_category(p_nombre text, p_grupo_id bigint default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_grupo bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear categorías';
  end if;
  -- Un admin de grupo siempre crea dentro de su propio grupo (se ignora
  -- cualquier otro valor que mande el cliente); super_admin debe indicar
  -- explícitamente en qué grupo (no tiene uno propio).
  if public.is_super_admin() then
    v_grupo := p_grupo_id;
  else
    v_grupo := public.current_grupo_id();
  end if;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio';
  end if;
  insert into public.categories (nombre, grupo_id) values (btrim(p_nombre), v_grupo) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.create_category(text, bigint) to authenticated;

create or replace function public.update_category(p_id bigint, p_nombre text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() and public.can_access_category(p_id)) then
    raise exception 'Solo un administrador puede editar categorías';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio';
  end if;
  update public.categories set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Categoría % no existe', p_id; end if;
end;
$$;
grant execute on function public.update_category(bigint, text) to authenticated;

create or replace function public.delete_category(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() and public.can_access_category(p_id)) then
    raise exception 'Solo un administrador puede eliminar categorías';
  end if;
  if exists (select 1 from public.products where category_id = p_id and deleted_at is null) then
    raise exception 'Hay productos en esta categoría — reasígnalos o elimínalos antes de borrarla';
  end if;

  update auth.users
     set raw_app_meta_data = raw_app_meta_data - 'role' - 'area'
   where raw_app_meta_data ->> 'area' = p_id::text;

  delete from public.categories where id = p_id;
  if not found then raise exception 'Categoría % no existe', p_id; end if;
end;
$$;
grant execute on function public.delete_category(bigint) to authenticated;

-- Reasigna la categoría de un producto — antes NO validaba categoría
-- alguna (solo is_admin() global); ahora exige poder tocar tanto la
-- categoría actual del producto como la destino, mismo patrón que ya usa
-- merge_product. Esto además bloquea mover un producto a una categoría de
-- OTRO grupo sin querer.
create or replace function public.update_product_category(p_product_id bigint, p_category_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_current_cat bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reasignar la categoría de un producto';
  end if;
  select category_id into v_current_cat from public.products where id = p_product_id;
  if not found then raise exception 'Producto % no existe', p_product_id; end if;
  if not public.can_access_category(v_current_cat) or not public.can_access_category(p_category_id) then
    raise exception 'No tienes permiso para reasignar insumos de esta categoría';
  end if;
  update public.products set category_id = p_category_id, updated_at = now() where id = p_product_id;
end;
$$;
grant execute on function public.update_product_category(bigint, bigint) to authenticated;

-- Lista usuarios con acceso — super_admin ve admin+coordinador de TODOS los
-- grupos (con el nombre del grupo); un admin de grupo sigue viendo solo
-- coordinador de su propio grupo, igual que antes.
drop function if exists public.list_users_with_access();
create or replace function public.list_users_with_access() returns table(
  ci bigint, name text, surname text, email text, role text, area text, active boolean,
  phone_company_code text, phone_number text, grupo_id bigint, grupo_nombre text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede listar usuarios';
  end if;

  return query
    select p.ci, p.name, p.surname, u.email::text,
           u.raw_app_meta_data ->> 'role', u.raw_app_meta_data ->> 'area',
           (u.banned_until is null or u.banned_until < now()),
           ph.company_code, ph.number,
           p.grupo_id, g.nombre
    from public.persons p
    join auth.users u on u.id = p.auth_user_id
    left join public.phones ph on ph.id = p.phone_id
    left join public.grupos g on g.id = p.grupo_id
    where u.raw_app_meta_data ->> 'role' is not null
      and (
        (public.is_super_admin() and u.raw_app_meta_data ->> 'role' <> 'super_admin')
        or (not public.is_super_admin() and u.raw_app_meta_data ->> 'role' = 'coordinador' and p.grupo_id = public.current_grupo_id())
      )
    order by p.name, p.surname;
end;
$$;
grant execute on function public.list_users_with_access() to authenticated;

create or replace function public.count_active_users() returns integer
language sql security definer set search_path = public as $$
  select count(*)::integer
  from public.persons p
  join auth.users u on u.id = p.auth_user_id
  where u.raw_app_meta_data ->> 'role' in ('admin', 'coordinador', 'super_admin')
    and (u.banned_until is null or u.banned_until < now())
    and (public.is_super_admin() or p.grupo_id = public.current_grupo_id())
$$;
grant execute on function public.count_active_users() to authenticated;

-- create_person: ahora exige grupo_id (mismo criterio forzado que
-- create_category — admin siempre crea en su propio grupo, super_admin debe
-- indicarlo explícitamente).
-- Mismo caso que create_category: p_grupo_id es nuevo, hace falta el DROP
-- para no dejar la vieja create_person(6 params) como overload suelto.
drop function if exists public.create_person(bigint, text, text, text, text, public.person_categoria);
create or replace function public.create_person(
  p_ci bigint, p_name text, p_surname text, p_phone_company_code text, p_phone_number text,
  p_categoria public.person_categoria default null, p_grupo_id bigint default null
) returns table(ci bigint, name text, surname text)
language plpgsql security definer set search_path = public as $$
declare v_phone_id bigint; v_grupo bigint;
begin
  if public.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para crear personas';
  end if;
  if public.is_super_admin() then
    v_grupo := p_grupo_id;
  else
    v_grupo := public.current_grupo_id();
  end if;
  if v_grupo is null then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  insert into public.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from public.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  insert into public.persons (ci, name, surname, phone_id, categoria, grupo_id)
    values (p_ci, p_name, p_surname, v_phone_id, p_categoria, v_grupo);

  return query select p_ci, p_name, p_surname;
end;
$$;
grant execute on function public.create_person(bigint, text, text, text, text, public.person_categoria, bigint) to authenticated;

-- admin_update_person no chequeaba a quién pertenecía la persona editada —
-- un admin de grupo podía editar (incluso renombrar la cédula de) CUALQUIER
-- persona del sistema, de cualquier grupo. Coherente con "directorio
-- separado por grupo": se agrega el chequeo de grupo de la persona objetivo.
create or replace function public.admin_update_person(
  p_ci bigint, p_new_ci bigint, p_name text, p_surname text,
  p_phone_company_code text, p_phone_number text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_phone_id bigint; v_grupo bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede editar los datos de una persona';
  end if;
  select grupo_id into v_grupo from public.persons where ci = p_ci;
  if not found then
    raise exception 'No existe ninguna persona con cédula %', p_ci;
  end if;
  if not public.can_access_grupo(v_grupo) then
    raise exception 'No tienes permiso para editar a esta persona';
  end if;
  if p_new_ci is null or p_new_ci <= 0 then
    raise exception 'Cédula inválida';
  end if;
  if p_name is null or btrim(p_name) = '' or p_surname is null or btrim(p_surname) = '' then
    raise exception 'Nombre y apellido son obligatorios';
  end if;
  if p_new_ci <> p_ci and exists (select 1 from public.persons where ci = p_new_ci) then
    raise exception 'Ya existe otra persona con la cédula %', p_new_ci;
  end if;

  insert into public.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from public.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  if p_new_ci <> p_ci then
    update public.persons set ci = p_new_ci where ci = p_ci;
  end if;

  update public.persons
     set name = btrim(p_name), surname = btrim(p_surname), phone_id = v_phone_id, updated_at = now()
   where ci = p_new_ci;
end;
$$;
grant execute on function public.admin_update_person(bigint, bigint, text, text, text, text) to authenticated;

-- Grupos de extensión — CRUD mínimo, super_admin-only (mismo patrón que
-- create_category/update_category). Sin delete en esta versión: igual de
-- arriesgado que borrar una categoría con productos, un nivel más arriba —
-- se agrega más adelante si hace falta.
create or replace function public.create_grupo(p_nombre text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if not public.is_super_admin() then
    raise exception 'Solo un super administrador puede crear grupos de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre del grupo es obligatorio';
  end if;
  insert into public.grupos (nombre) values (btrim(p_nombre)) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.create_grupo(text) to authenticated;

create or replace function public.update_grupo(p_id bigint, p_nombre text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then
    raise exception 'Solo un super administrador puede editar grupos de extensión';
  end if;
  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre del grupo es obligatorio';
  end if;
  update public.grupos set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Grupo % no existe', p_id; end if;
end;
$$;
grant execute on function public.update_grupo(bigint, text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
--  7. Bootstrap — correr a mano después de lo de arriba
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Promové tu cuenta a super_admin (reemplazá el correo):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
-- where email = 'TU-CORREO-AQUI';

-- 2. (Opcional) renombrá el grupo por defecto que recibió los datos ya existentes:
-- update public.grupos set nombre = 'NOMBRE-DEL-PRIMER-GRUPO' where nombre = 'Sin asignar';

-- Cualquier admin/coordinador ya existente queda con grupo_id del grupo por
-- defecto (falta setearlo en su app_metadata — no lo toca esta migración,
-- ya que vive en auth.users.raw_app_meta_data y hay que decidir a mano si
-- ese admin es en realidad el super_admin o un admin de un grupo real):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
--   'grupo_id', (select id from public.grupos where nombre = 'Sin asignar')
-- ) where email = 'CORREO-DE-UN-ADMIN-O-COORDINADOR-EXISTENTE';
