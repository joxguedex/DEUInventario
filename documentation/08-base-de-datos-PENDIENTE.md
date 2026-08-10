# 8. Base de datos — ya no pendiente (resuelto 2026-07-19)

> Este documento quedaba **deliberadamente sin desarrollar** hasta tener
> acceso a las credenciales reales de la instancia de Supabase. Ese acceso
> llegó como parte de la unificación de acceso con UCVAcopio/UCVComandas
> (`00-plan-general.md`/`02-inventario.md`, carpeta hermana a los 3 repos):
> Inventario **cortó conexión** del proyecto Supabase externo
> (`bwdipsshosclqoxbjbho`) al proyecto compartido con esos 2 sistemas
> (`fndrmxjykrtoddhstbyv`, esquema `new_schema_archive`). Todo lo de abajo
> está verificado contra esa base real — con consultas directas de solo
> lectura y, para las RPCs, con pruebas end-to-end reales (usuarios/
> productos sintéticos creados y borrados en la misma sesión). El nombre
> del archivo se mantiene (varios documentos lo enlazan por esta ruta) pero
> ya no describe un hueco pendiente.

## Qué había en el repo, y qué de eso resultó correcto

La tabla de `supabase/*.sql` que describía la versión anterior de este
documento sigue siendo un buen mapa de qué prueba cada script — con dos
correcciones reales encontradas al cortar:

| Archivo | ¿Coincidía con la BD real? |
|---|---|
| `supabase-setup.sql` | El diseño base (`products`/`inventory`/`movements`/`movement_items`, trigger de ajuste de stock) sí coincide en espíritu con `new_schema_archive` — pero los nombres/columnas exactos no son 1:1, ver abajo. |
| `fix-unmark-delete.sql` (`uncount_item`/`delete_count`) | El diseño (revertir/recalcular `last_counted_at`) es correcto, pero **la implementación tuvo que cambiar**: `new_schema_archive` ya tiene triggers propios (`trg_movement_items_apply`, `trg_movement_items_update_delete`) que ajustan `inventory.qnty` automáticamente en INSERT/UPDATE/DELETE de `movement_items` — el diseño viejo de Inventario no tenía ese trigger para DELETE y revertía `qnty` a mano dentro de `delete_count`; portarlo literal habría duplicado el ajuste. |
| `realtime-migration.sql` | Apuntaba al proyecto externo viejo — `new_schema_archive.products`/`inventory` **no** estaban en la publicación `supabase_realtime` (confirmado por consulta directa); se agregaron en el corte. |
| `voluntarios_migration.sql` (columnas `status`/`turno`/`departamento` en `persons`) | **No existen** en `new_schema_archive.persons` — la vista de Voluntarios que las usaba se reescribió por completo (ver `04-vistas-ui.md`), no se intentó migrar esas columnas. |
| `schema.txt` | Confirmado como referencia de un esquema distinto (el externo viejo) — no se usó para nada del corte. |

## Esquema real (`new_schema_archive`) contra el que habla la app desde el corte

Confirmado por consulta directa (`information_schema.columns` + inspección
de triggers/constraints reales), no inferido de archivos `.sql` sueltos:

- **`products`**: `id BIGINT`, `name`, `type` (enum
  `product_type`, ya en español — confirmado por UCVAcopio,
  `06-esquema-base-datos.md` de ese repo), `created_at`, `updated_at`,
  `metadata JSONB`, `umbral INTEGER`, `client_id TEXT NOT NULL`,
  `deleted_at`, y **`unidad TEXT NOT NULL DEFAULT 'und'`** (agregada en el
  corte, `supabase-migrations/04-columnas-inventario-2026-07-18.sql` — la
  columna `measure` original se eliminó, ver
  `supabase-migrations/18-drop-column-measure-*.sql`).
- **`inventory`**: `product_id BIGINT` (PK, FK a `products`), `qnty
  INTEGER`, y **`last_counted_at TIMESTAMPTZ`**/**`last_counted_by TEXT`**
  (agregadas en el mismo script que `unidad`).
- **`movements`**: `id`, `direction` (enum `in`/`out`), `destination`,
  `received_by`/`delivered_by` (FK a `persons.ci`, no `approved_by` como
  asumía algún borrador viejo), `occurred_at`, `note`, `client_op_id TEXT`
  (nullable, no `UNIQUE` a nivel de constraint explícito pero usado como
  tal por convención de idempotencia).
- **`movement_items`**: `id`, `movement_id` (FK `ON DELETE CASCADE`),
  `product_id` (FK `ON DELETE RESTRICT`), `qnty`.
- **Triggers ya existentes** (no los creó este repo, son de
  `new_schema_archive` compartido): `trg_movement_items_apply` (AFTER
  INSERT, ajusta `inventory.qnty` — también actualiza `requests` si
  aplica, algo que el diseño viejo de Inventario no tenía) y
  `trg_movement_items_update_delete` (AFTER UPDATE OR DELETE, revierte/
  ajusta `inventory.qnty`). Por esto, `apply_count`/`uncount_item`/
  `delete_count` del corte **no** ajustan `inventory.qnty` a mano en el
  camino de inserción/borrado — el trigger ya lo hace, y hacerlo dos veces
  sería un bug.
- **`persons`**: `ci BIGINT` (PK), `name`, `surname`, `phone_id BIGINT`
  (FK a `phones.id`, **`NOT NULL`** — hallazgo real, ver abajo),
  `created_at`, `updated_at`, `categoria` (enum, de UCVComandas — no
  usado por Inventario).
- **`phones`**: `id BIGINT` (PK, serial), `company_code`, `number` —
  `UNIQUE(company_code, number)`.
- **`person_credentials`**: `ci` (PK/FK a `persons.ci`), `password`,
  `role` (enum `person_role`: `admin`/`coordinador`/`voluntario`),
  `area` (`text`, nullable), `created_at`, `updated_at`. Ver
  [05-autenticacion.md](./05-autenticacion.md) para el detalle completo —
  esta tabla y su RPC de login son compartidas con UCVAcopio/UCVComandas,
  no propias de Inventario.

## RLS / grants

⚠️ **Contradicción sin resolver (detectada 2026-07-28)**: esta sección
afirmaba (abajo, sin tocar desde que se escribió) que `anon` tenía
`SELECT`/`INSERT`/`UPDATE`/`DELETE` directo sobre `products`/`inventory`/
`movements`/`movement_items`/`persons`/`phones` con **RLS deshabilitada**.
Corrección del usuario del 2026-07-28, al implementar el área "General" y
la edición extendida de usuarios (`05-autenticacion.md`): **RLS está activa
en TODAS las tablas de este esquema**, sin excepción — contradice
directamente lo que sigue. No se pudo re-verificar contra la base real
desde este repo (sin acceso a Supabase Studio/`information_schema` desde
acá); dos lecturas posibles, sin resolver:

1. Esta sección estuvo **mal desde que se escribió** (RLS siempre estuvo
   activa, alguien confirmó lo contrario por error), y todo lo que asume
   "escritura directa sin RPC" contra `persons`/`phones` (ej. "Mi perfil"
   en `05-autenticacion.md`) probablemente **nunca funcionó** en producción.
2. RLS se activó **después** de escribirse esta sección (cambio de
   configuración posterior en Supabase, no reflejado acá), y ese código
   funcionaba hasta entonces pero dejó de hacerlo en algún punto sin que
   nadie lo notara/documentara.

Por las dudas, el trabajo nuevo del 2026-07-28
(`admin_update_user_profile`/`admin_reset_password`, ver
`supabase-migrations/20-area-general-y-edicion-usuarios-*.sql`) se hizo
como RPC `SECURITY DEFINER`, no como REST directo. **"Mi perfil"
(`js/views/admin.js`) se corrigió el mismo día** con el mismo criterio —
`get_own_phone`/`update_own_profile`
(`supabase-migrations/21-fix-mi-perfil-rpc-2026-07-28.sql`, ver
`05-autenticacion.md`) — así que ya no depende de qué lectura de la
contradicción de arriba sea la correcta: funciona sea cual sea el estado
real de RLS en `persons`/`phones`. Lo que queda sin resolver/verificar es
el resto de la afirmación original (`products`/`inventory`/`movements`/
`movement_items`), que ningún cambio de esta fecha tocó — el resto de la
app (`sync.js`, `store.js`, `views/despachos.js`, etc.) sigue asumiendo
escritura REST directa sobre esas tablas.

Lo que sigue es el texto original, sin verificar desde esa fecha:

> `anon` tiene `SELECT`/`INSERT`/`UPDATE`/`DELETE` directo sobre `products`/
> `inventory`/`movements`/`movement_items`/`persons`/`phones` — **RLS
> deshabilitada** en esas tablas (no hay políticas que filtren filas). El
> control de "quién puede hacer qué" es 100% del lado del cliente
> (`js/auth.js`, ver `05-autenticacion.md`) — decisión de arquitectura
> explícita, documentada en `00-plan-general.md` §2 de la carpeta hermana,
> no un hueco de seguridad sin resolver.

La única tabla con acceso realmente restringido a nivel de base — bajo
cualquiera de las 2 lecturas de arriba — es `person_credentials`: `anon`
**no** tiene `SELECT` directo sobre ella (correcto — el hash de password no
debe exponerse vía REST), por eso hacen falta las RPCs `SECURITY DEFINER`
(`person_login`, `create_user`, `list_users`, etc.) para leer/escribirla.

## Hallazgo no anticipado por el plan original: `persons.phone_id NOT NULL`

El sub-plan de la unificación de acceso (`03-acopio.md`/`02-inventario.md`)
especificaba `create_user(p_actor_ci, p_ci, p_password, p_name, p_surname,
p_role, p_area)` — 7 parámetros, sin teléfono. Al probar contra la BD real,
esa firma **fallaba para cualquier usuario nuevo** porque
`persons.phone_id` es `NOT NULL` (FK a `phones`) y la RPC no lo poblaba. Se
corrigió agregando `p_phone_company_code`/`p_phone_number` (9 parámetros
en total) — ver `supabase-migrations/06-fix-create-user-telefono-2026-07-18.sql`
(carpeta hermana a los 3 repos). Esto es la razón real por la que el
formulario de alta de usuarios (`04-vistas-ui.md`) sigue pidiendo teléfono.

## Volumen de datos real (al 2026-07-19)

`products`: más de mil filas reales (catálogo del centro de acopio, migrado
por un workstream aparte — ver `00-plan-general.md` §7). `person_credentials`:
19 filas (5 `admin`, 7 `coordinador`, 7 `voluntario`, todos con
`area='sala situacional'` al momento del corte de roles). No se hizo un
conteo exhaustivo de `movements`/`movement_items` como parte de este
trabajo — no era necesario para verificar que el motor de conteo funciona.
