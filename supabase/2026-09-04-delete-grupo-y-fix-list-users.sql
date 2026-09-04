-- ══════════════════════════════════════════════════════════════════════════
--  Aplicar en: Panel de Supabase → SQL Editor → pegar entero → Run.
--  Idempotente (create or replace / drop if exists): correrlo más de una vez
--  no rompe nada.
--
--  Contiene dos cosas:
--
--  1. sibex.delete_grupo(p_id, p_force) — RPC nueva, pedida para poder
--     borrar un grupo de extensión desde la pestaña "Grupos" (solo
--     super_admin). No existía ninguna forma de hacer esto hasta ahora.
--
--  2. Re-aplica sibex.list_users_with_access() tal cual debería estar hoy
--     (idéntica a la de supabase/sibex-schema-install.sql) — por si el
--     síntoma reportado ("el super_admin no ve los administradores de grupo
--     que él mismo creó") viene de que el proyecto Supabase quedó con una
--     versión más vieja de esta función (de antes de que existiera
--     super_admin/grupos) y el archivo del repo nunca se volvió a correr
--     completo. Si el problema seguía presente después de correr esto,
--     avisar — significaría que el bug está en otro lado.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. delete_grupo ──────────────────────────────────────────────────────
-- Elimina un grupo de extensión COMPLETO — exclusivo de super_admin, desde
-- la pestaña "Grupos" (views/grupos.js → openEditGrupoModal). Sin `force`,
-- bloquea si el grupo tiene cualquier dato real asociado (personas,
-- categorías vinculadas, insumos con conteo, movimientos, comandas o
-- comunicados) y devuelve el detalle en el mensaje — la UI lo usa para
-- ofrecer forzar el borrado en cascada (mismo patrón que delete_category).
-- Con `force = true`:
--   - Revoca el acceso de cualquier cuenta de Auth del grupo con un UPDATE
--     directo sobre auth.users (mismo criterio que delete_category: tocar
--     app_metadata no requiere la Admin API, solo crear/borrar la cuenta en
--     sí la requeriría) — la cuenta queda huérfana (sin rol/área/grupo),
--     login() la rechaza de inmediato (ver js/auth.js#login), aunque el
--     registro de auth.users no se borra.
--   - Borra movements/comandas del grupo (cascadean solas sus _items/
--     _imagenes) e inventory/comms.
--   - Borra persons del grupo: seguro por diseño — person_status/
--     conductores están declaradas "on delete cascade" contra persons(ci), y
--     movements/comandas/requests/comanda_items solo la REFERENCIAN con
--     "on delete set null" (y las de este grupo ya se borraron arriba).
--   - category_grupos y por último la fila de grupos — category_grupos
--     tiene "on delete cascade" contra grupos, así que un DELETE de la fila
--     de grupos ya la limpia sola.
create or replace function sibex.delete_grupo(p_id bigint, p_force boolean default false) returns void
language plpgsql security definer set search_path = sibex as $$
declare
  v_personas int; v_inventario int; v_movimientos int; v_comandas int; v_comunicados int; v_categorias int;
begin
  if not sibex.is_super_admin() then
    raise exception 'Solo un super administrador puede eliminar grupos de extensión';
  end if;
  if not exists (select 1 from sibex.grupos where id = p_id) then
    raise exception 'Ese grupo no existe';
  end if;

  select count(*) into v_personas    from sibex.persons where grupo_id = p_id;
  select count(*) into v_inventario  from sibex.inventory where grupo_id = p_id and deleted_at is null;
  select count(*) into v_movimientos from sibex.movements where grupo_id = p_id;
  select count(*) into v_comandas    from sibex.comandas where grupo_id = p_id;
  select count(*) into v_comunicados from sibex.comms where grupo_id = p_id;
  select count(*) into v_categorias  from sibex.category_grupos where grupo_id = p_id;

  if not p_force and (v_personas + v_inventario + v_movimientos + v_comandas + v_comunicados + v_categorias) > 0 then
    raise exception 'El grupo tiene % persona(s), % insumo(s) con conteo, % movimiento(s), % comanda(s), % comunicado(s) y % categoría(s) vinculada(s)',
      v_personas, v_inventario, v_movimientos, v_comandas, v_comunicados, v_categorias;
  end if;

  update auth.users
     set raw_app_meta_data = raw_app_meta_data - 'role' - 'area' - 'grupo_id'
   where (raw_app_meta_data ->> 'grupo_id')::bigint = p_id;

  delete from sibex.comandas  where grupo_id = p_id;
  delete from sibex.movements where grupo_id = p_id;
  delete from sibex.inventory where grupo_id = p_id;
  delete from sibex.comms     where grupo_id = p_id;
  delete from sibex.persons   where grupo_id = p_id;
  delete from sibex.grupos    where id = p_id;
end;
$$;
grant execute on function sibex.delete_grupo(bigint, boolean) to authenticated;

-- ── 2. Re-aplica list_users_with_access (defensivo) ─────────────────────
drop function if exists sibex.list_users_with_access();
create or replace function sibex.list_users_with_access() returns table(
  ci bigint, name text, surname text, email text, role text, area text, active boolean,
  phone_company_code text, phone_number text, grupo_id bigint, grupo_nombre text
)
language plpgsql security definer set search_path = sibex as $$
#variable_conflict use_column
begin
  if not sibex.is_admin() then
    raise exception 'Solo un administrador puede listar usuarios';
  end if;

  return query
    select p.ci, p.name, p.surname, u.email::text,
           u.raw_app_meta_data ->> 'role', u.raw_app_meta_data ->> 'area',
           (u.banned_until is null or u.banned_until < now()),
           ph.company_code, ph.number,
           p.grupo_id, g.nombre
    from sibex.persons p
    join auth.users u on u.id = p.auth_user_id
    left join sibex.phones ph on ph.id = p.phone_id
    left join sibex.grupos g on g.id = p.grupo_id
    where u.raw_app_meta_data ->> 'role' is not null
      and (
        (sibex.is_super_admin() and u.raw_app_meta_data ->> 'role' <> 'super_admin')
        or (not sibex.is_super_admin() and u.raw_app_meta_data ->> 'role' = 'coordinador' and p.grupo_id = sibex.current_grupo_id())
      )
    order by p.name, p.surname;
end;
$$;
grant execute on function sibex.list_users_with_access() to authenticated;
