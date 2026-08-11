-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- "Editar acceso" en Usuarios solo dejaba tocar área y contraseña. Ahora un
-- admin puede editar TODA la información de una persona: nombre, apellido,
-- cédula, teléfono (esta parte, acá) y correo (aparte, en la Edge Function
-- manage-users#update_email — desplegar esa función de nuevo tras este SQL).
--
-- Renombrar una cédula es delicado porque `persons.ci` es la PK y está
-- referenciada por FK desde más de una decena de tablas (comandas,
-- movements, conductores, ubicaciones, etc.) — antes de este script,
-- cualquiera de esas filas habría bloqueado el update con una violación de
-- integridad referencial. Este script migra TODAS esas FKs a
-- "on update cascade" recorriendo pg_constraint (no hay que listar tablas a
-- mano, ni acá ni si el esquema agrega otra FK hacia persons(ci) después),
-- así que un solo `update persons set ci = ...` reatribuye automáticamente
-- todo el historial de esa persona a la nueva cédula.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

drop function if exists public.list_users_with_access();
create or replace function public.list_users_with_access() returns table(
  ci bigint, name text, surname text, email text, role text, area text, active boolean,
  phone_company_code text, phone_number text
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
           ph.company_code, ph.number
    from public.persons p
    join auth.users u on u.id = p.auth_user_id
    left join public.phones ph on ph.id = p.phone_id
    where u.raw_app_meta_data ->> 'role' is not null
      and u.raw_app_meta_data ->> 'role' <> 'admin'
    order by p.name, p.surname;
end;
$$;
grant execute on function public.list_users_with_access() to authenticated;

create or replace function public.admin_update_person(
  p_ci bigint, p_new_ci bigint, p_name text, p_surname text,
  p_phone_company_code text, p_phone_number text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_phone_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede editar los datos de una persona';
  end if;
  if not exists (select 1 from public.persons where ci = p_ci) then
    raise exception 'No existe ninguna persona con cédula %', p_ci;
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

do $$
declare rec record;
begin
  for rec in
    select con.conname, cl.relname as table_name, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    where con.contype = 'f'
      and con.confrelid = 'public.persons'::regclass
  loop
    execute format('alter table public.%I drop constraint %I', rec.table_name, rec.conname);
    execute format('alter table public.%I add constraint %I %s on update cascade', rec.table_name, rec.conname, rec.def);
  end loop;
end $$;

-- Refrescar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
