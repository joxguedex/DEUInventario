-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Bug: al crear un insumo nuevo (js/store.js#addNuevo → sync.js sube el
-- producto directo a /rest/v1/products, sin pasar por ninguna RPC), el
-- trigger trg_products_create_inventory dispara create_inventory_row(),
-- que hace un INSERT en `inventory` — pero `inventory` NO tiene ninguna
-- política RLS que permita INSERT directo a nadie (ver supabase/new-
-- project-schema.sql §12: todas las escrituras sobre inventory pasan por
-- RPCs SECURITY DEFINER como apply_count). Como create_inventory_row()
-- corría SIN SECURITY DEFINER, ese INSERT se evaluaba con los permisos del
-- usuario que creó el producto y la política lo rechazaba con 403 ("new
-- row violates row-level security policy for table inventory").
--
-- Efecto colateral grave: js/sync.js trataba CUALQUIER 403 como "la sesión
-- venció" (mismo código para 401 y 403) y cerraba la sesión del usuario de
-- forma automática — un bug de permisos totalmente ajeno a su sesión lo
-- sacaba de la app. Ver el fix aparte en js/sync.js + js/errors.js (no
-- forma parte de este script SQL).
--
-- Mismo bug ya había ocurrido y quedado documentado/corregido en el
-- proyecto compartido viejo — ver supabase/fix-rls-inventory.sql.
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

create or replace function public.create_inventory_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (product_id) values (new.id)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

-- Refrescar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
