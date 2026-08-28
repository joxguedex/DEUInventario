-- ══════════════════════════════════════════════════════════════════════════
--  Fix: inventory.updated_at faltante — rompe el pull incremental
-- ------------------------------------------------------------------------
--  La revisión "productos multigrupo" (2026-08-25) partió el pull en dos
--  consultas (ver js/sync.js#_pull, documentation/06-sincronizacion-
--  cliente.md), y la segunda filtra/selecciona inventory.updated_at para
--  detectar conteos que cambiaron SIN tocar el producto. Pero esa columna
--  nunca se agregó a la tabla — ni en el script de esa revisión, ni en
--  new-project-schema.sql/sibex-schema-install.sql — así que PostgREST
--  devuelve 400 ("column inventory.updated_at does not exist") en cada
--  sync. Este script la agrega, con el mismo patrón genérico
--  (`sibex.set_updated_at()`, ya usado por products y el resto de tablas
--  con esta columna — ver sibex-schema-install.sql sección 7.1).
--
--  Pegar entero en el SQL Editor de Supabase (proyecto SIBEX UCV, schema
--  `sibex`). Idempotente: se puede reintentar sin problema.
-- ══════════════════════════════════════════════════════════════════════════

alter table sibex.inventory add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_inventory_updated_at on sibex.inventory;
create trigger trg_inventory_updated_at before update on sibex.inventory
  for each row execute function sibex.set_updated_at();
