-- ══════════════════════════════════════════════════════════════════════════
--  Fix: recursión infinita en RLS de movement_items/comanda_items ↔
--  movements/comandas (500 en Historial de Ingresos/Egresos)
-- ------------------------------------------------------------------------
--  La revisión "productos multigrupo" (2026-08-25) le agregó a
--  movement_items_select/comanda_items_select un chequeo de grupo que
--  vuelve a consultar movements/comandas (exists (select ... from
--  sibex.movements ...)) — pero movements_select/comandas_select YA
--  consultaban movement_items/comanda_items de vuelta (desde antes de esa
--  revisión). Con las dos direcciones referenciándose entre sí, Postgres no
--  puede resolver la expansión de RLS y tira "infinite recursion detected
--  in policy for relation movements/comandas" — PostgREST lo devuelve como
--  500 apenas se hace un JOIN entre las dos tablas, exactamente lo que
--  hacen egresos.js/ingresos.js (movement_items!inner(movements)).
--
--  Arreglo: mover el lado "movement_items/comanda_items → movements/
--  comandas" a una función security definer (mismo patrón que
--  current_person_ci(), que ya lee sibex.persons sin pasar por su RLS) —
--  así ese lado de la consulta no vuelve a evaluar la policy de
--  movements/comandas y el ciclo se rompe.
--
--  Pegar entero en el SQL Editor de Supabase (proyecto SIBEX UCV, schema
--  `sibex`). Idempotente.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function sibex.movement_grupo(p_movement_id bigint) returns bigint
language sql stable security definer set search_path = sibex as $$
  select grupo_id from sibex.movements where id = p_movement_id
$$;

create or replace function sibex.comanda_grupo(p_comanda_id bigint) returns bigint
language sql stable security definer set search_path = sibex as $$
  select grupo_id from sibex.comandas where id = p_comanda_id
$$;

drop policy if exists movement_items_select on sibex.movement_items;
create policy movement_items_select on sibex.movement_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = movement_items.product_id and sibex.can_access_category(p.category_id))
    and sibex.can_access_grupo(sibex.movement_grupo(movement_items.movement_id))
  );

drop policy if exists comanda_items_select on sibex.comanda_items;
create policy comanda_items_select on sibex.comanda_items for select
  to authenticated using (
    exists (select 1 from sibex.products p where p.id = comanda_items.producto_id and sibex.can_access_category(p.category_id))
    and sibex.can_access_grupo(sibex.comanda_grupo(comanda_items.comanda_id))
  );
