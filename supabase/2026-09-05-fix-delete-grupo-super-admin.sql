-- ══════════════════════════════════════════════════════════════════════════
--  Aplicar en: Panel de Supabase → SQL Editor → pegar entero → Run.
--  Idempotente: correrlo más de una vez no rompe nada.
--
--  Bug: delete_grupo() limpiaba role/area/grupo_id de CUALQUIER cuenta de
--  auth.users cuyo grupo_id coincidiera con el grupo borrado, sin excluir a
--  super_admin. Un super_admin no tiene grupo propio, pero si su cuenta
--  arrastraba un grupo_id viejo (de antes de que grupo_id pudiera ser null
--  para ese rol) que apuntara justo al grupo eliminado, se quedaba sin rol
--  al emitirse su próximo JWT — bloqueado del sistema entero (401 en cada
--  pull/RPC).
--
--  Este script:
--    1. Repara la función delete_grupo() para nunca tocar una cuenta
--       super_admin (ni su persons, si tenía una).
--    2. Repara YA a cualquier auth.users con grupo_id no nulo pero SIN rol
--       (el daño que ya causó el bug) reponiéndole role='super_admin' — solo
--       tiene sentido correrlo si la cuenta afectada de verdad es un super
--       admin; si el correo no es el esperado, avisar antes de correr esto.
-- ══════════════════════════════════════════════════════════════════════════

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
   where (raw_app_meta_data ->> 'grupo_id')::bigint = p_id
     and raw_app_meta_data ->> 'role' <> 'super_admin';

  delete from sibex.comandas  where grupo_id = p_id;
  delete from sibex.movements where grupo_id = p_id;
  delete from sibex.inventory where grupo_id = p_id;
  delete from sibex.comms     where grupo_id = p_id;
  delete from sibex.persons   where grupo_id = p_id
    and ci not in (
      select p.ci from sibex.persons p
      join auth.users u on u.id = p.auth_user_id
      where u.raw_app_meta_data ->> 'role' = 'super_admin'
    );
  delete from sibex.grupos    where id = p_id;
end;
$$;
grant execute on function sibex.delete_grupo(bigint, boolean) to authenticated;

-- Repara la cuenta ya dañada: cualquier auth.users sin 'role' pero que SÍ
-- tenga una fila en sibex.persons (o sea, alguna vez tuvo acceso) y cuyo
-- correo/uso deje claro que es el super_admin recién bloqueado. Ajustá el
-- WHERE al correo real antes de correr esta parte.
-- update auth.users
--   set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'super_admin')
-- where email = 'CORREO_DEL_SUPER_ADMIN_AFECTADO';
