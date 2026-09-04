-- ══════════════════════════════════════════════════════════════════════════
--  Aplicar en: Panel de Supabase → SQL Editor → pegar entero → Run.
--  Idempotente (alter column ... drop not null / create or replace): correrlo
--  más de una vez no rompe nada.
--
--  Un super_admin no pertenece a ningún grupo de extensión en particular
--  (ve/administra todos) — obligarlo a tener uno en `persons.grupo_id` era
--  arbitrario. Esto:
--    1. Quita el NOT NULL de sibex.persons.grupo_id.
--    2. Relaja create_person(): sigue exigiendo grupo para admin/coordinador
--       (current_grupo_id() siempre debería dárselo), pero un super_admin ya
--       puede crear su propia persona (nombre/ci/teléfono, para "Mi perfil")
--       sin indicar ninguno.
--  El resto del esquema (RLS de persons/phones, list_users_with_access,
--  count_active_users, delete_grupo, admin_update_person) ya maneja
--  grupo_id null correctamente vía el atajo is_super_admin() en
--  can_access_grupo()/can_access_category(), o simplemente no hace match en
--  un WHERE grupo_id = X — no necesitan cambios.
-- ══════════════════════════════════════════════════════════════════════════

alter table sibex.persons alter column grupo_id drop not null;

create or replace function sibex.create_person(
  p_ci bigint, p_name text, p_surname text,
  p_phone_company_code text, p_phone_number text,
  p_categoria sibex.person_categoria default null,
  p_grupo_id bigint default null
) returns table(ci bigint, name text, surname text)
language plpgsql security definer set search_path = sibex as $$
#variable_conflict use_column
declare v_phone_id bigint; v_grupo bigint; v_existing_grupo bigint;
begin
  if sibex.current_role() not in ('admin', 'coordinador', 'super_admin') then
    raise exception 'Rol sin permiso para crear personas';
  end if;
  -- Un super_admin NO tiene grupo propio (ve/administra todos) — puede
  -- crear su propia persona sin indicar ninguno, a diferencia de
  -- admin/coordinador, que siempre crean dentro del suyo.
  v_grupo := case when sibex.is_super_admin() then p_grupo_id else sibex.current_grupo_id() end;
  if v_grupo is null and not sibex.is_super_admin() then
    raise exception 'Falta indicar el grupo de extensión';
  end if;

  select p.grupo_id into v_existing_grupo from sibex.persons p where p.ci = p_ci;
  if v_existing_grupo is not null and v_existing_grupo <> v_grupo then
    raise exception 'Esa cédula ya está registrada en otro grupo de extensión';
  end if;

  insert into sibex.phones (company_code, number)
    values (p_phone_company_code, p_phone_number)
    on conflict (company_code, number) do nothing;
  select id into v_phone_id from sibex.phones
    where company_code = p_phone_company_code and number = p_phone_number;

  insert into sibex.persons (ci, name, surname, phone_id, categoria, grupo_id)
    values (p_ci, p_name, p_surname, v_phone_id, p_categoria, v_grupo)
  on conflict (ci) do update set
    name = excluded.name, surname = excluded.surname, phone_id = excluded.phone_id;

  return query select p_ci, p_name, p_surname;
end;
$$;
grant execute on function sibex.create_person(bigint, text, text, text, text, sibex.person_categoria, bigint) to authenticated;
