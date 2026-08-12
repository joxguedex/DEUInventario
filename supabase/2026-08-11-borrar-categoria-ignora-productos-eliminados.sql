-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- delete_category rechazaba el borrado si CUALQUIER producto (incluso ya
-- soft-borrado, deleted_at no nulo) seguía apuntando a la categoría — un
-- producto borrado nunca se va físicamente de la BD (se conserva su
-- historial), así que una categoría con solo insumos ya eliminados quedaba
-- imposible de borrar aunque, para el usuario, estuviera vacía.
--
-- Dos cambios:
--  1. El chequeo "hay productos en esta categoría" ahora ignora los
--     soft-borrados (deleted_at is null).
--  2. products.category_id pasa a nullable y su FK a ON DELETE SET NULL (era
--     NOT NULL + ON DELETE RESTRICT) — si quedan productos soft-borrados
--     apuntando a la categoría que se borra, el DELETE ya no se bloquea:
--     esas filas simplemente quedan con category_id = NULL, conservando su
--     historial. Un producto VIVO jamás llega a este punto porque el
--     chequeo de arriba ya frenó el borrado antes.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

alter table public.products alter column category_id drop not null;

alter table public.products drop constraint if exists products_category_id_fkey;
alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories (id) on delete set null;

create or replace function public.delete_category(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
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

-- Refrescar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
