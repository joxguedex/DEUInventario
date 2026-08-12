-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- `umbral` solo cubría el mínimo (avisa cuando falta stock). Se agrega
-- `umbral_max`, el límite superior: cuando la cantidad lo supera, el insumo
-- pasa a estado "exceso" en el frontend (js/helpers.js#iStatus) — se pinta
-- azul, no rojo, porque tener demasiado no es necesariamente un problema.
--
-- Nulo/0 = "sin límite superior" (mismo criterio que umbral=0 = "no
-- necesario" reponer). El constraint solo exige que, SI está fijado, sea
-- mayor que el umbral mínimo — evita configuraciones sin sentido (p.ej.
-- alertar bajo 20 y de exceso sobre 10).
--
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

alter table public.products add column if not exists umbral_max integer;

alter table public.products drop constraint if exists products_umbral_max_chk;
alter table public.products
  add constraint products_umbral_max_chk check (umbral_max is null or umbral_max >= 0);

alter table public.products drop constraint if exists products_umbral_range_chk;
alter table public.products
  add constraint products_umbral_range_chk check (umbral_max is null or umbral_max > umbral);

-- Refrescar el caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
