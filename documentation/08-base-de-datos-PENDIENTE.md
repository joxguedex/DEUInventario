# 8. Base de datos (nombre de archivo histórico — contenido ya no pendiente)

> El nombre del archivo se conserva porque varios documentos lo enlazan por
> esta ruta; el contenido no describe nada pendiente. Esquema canónico:
> [`supabase/new-project-schema.sql`](../supabase/new-project-schema.sql)
> (fresh install completo) + migraciones incrementales fechadas en
> `supabase/YYYY-MM-DD-*.sql` para el proyecto que ya está vivo. Proyecto
> Supabase **propio** de GBSInventario (credenciales en `js/config.js`),
> sin conexión a ningún otro sistema.

## Mapa del esquema (`new-project-schema.sql`)

Secciones, en orden:

1. **Enums** — `movement_direction`, `request_status`, `person_role`,
   `person_categoria`, `comanda_status`, `comanda_origen`,
   `comanda_imagen_tipo`, `ubicacion_*`/`tipo_*` (dominio dormido).
2. **Núcleo** — catálogo, inventario, movimientos, personas.
3. **Dominio comandas** — `comandas`/`comanda_items` y satélites.
4. **Dominio ubicaciones**, **5. Dominio conductores**, **6. Personas
   complementarias** (`ucevistas`/`afectados`/`facultades`/`carreras`) —
   heredados de un sistema hermano, dormidos (ver abajo).
7. **Triggers** — `set_updated_at` (genérico),
   `apply_movement_item`/`apply_movement_item_changes` (ajustan
   `inventory.qnty` de la fila `(product_id, grupo_id)` del propio
   movimiento en INSERT/UPDATE/DELETE de `movement_items` —
   `apply_count`/`uncount_item`/`delete_count` **no** tocan `qnty` a mano,
   el trigger ya lo hace), `movement_has_items` (todo movimiento necesita
   ≥1 línea), más triggers menores de `requests`/`phones`. **Ya no existen**
   `create_inventory_row`/`sync_product_grupo` (retirados en la revisión
   "productos multigrupo" — una fila de `inventory` ahora se crea
   explícitamente vía `add_product_to_grupo`, no automáticamente al
   insertar el producto).
8. **Autenticación** — helpers de rol/área/grupo a partir del JWT de
   Supabase Auth: `current_role()`, `current_area()`, `current_grupo_id()`,
   `is_admin()`, `is_super_admin()`, `is_coordinador()`,
   `current_person_ci()`, `current_category_id()`, `can_access_grupo(p_grupo_id)`,
   `can_access_category(p_category_id)` (super_admin: siempre; si no, exige
   que MI grupo tenga esa categoría vinculada vía `category_grupos` — ya NO
   implica poder tocar el conteo de un grupo puntual, eso exige además
   `can_access_grupo()` sobre la fila concreta de `inventory`/`movements`/
   `comandas`), `actor_note(p_tipo)` (arma `"Nombre - Área - Tipo"`, el
   formato que lee Historial/Ingresos/Egresos para inferir el tipo de
   movimiento), `link_person_login` (solo invocable por la Edge Function),
   `create_person`.
9. **Categorías** — catálogo COMPARTIDO entre grupos (revisión "productos
   multigrupo", 2026-08-25): `create_category(p_nombre, p_grupo_id)` busca
   por nombre (case-insensitive) y reutiliza si existe, si no crea y
   vincula al grupo (`category_grupos`, M2M) — el INSERT va envuelto en un
   `begin/exception when unique_violation` (fix 2026-08-29): dos grupos
   creando la misma categoría casi al mismo tiempo pueden pasar el SELECT
   los dos sin verse, `categories_nombre_unique_idx` evita la fila
   duplicada pero sin el catch el segundo se llevaba un 409 crudo en vez de
   terminar vinculándose a la del primero. `update_category` (rename
   global, afecta a todos los grupos que la usan); `delete_category(p_id,
   p_force, p_grupo_id)` desvincula del grupo (bloquea si hay conteos vivos
   de esa categoría en ESE grupo, salvo `p_force`; borra la categoría real
   solo si queda sin ningún grupo vinculado; despoja `role`/`area` de
   cualquier coordinador de ese grupo en esa categoría).
   `list_users_with_access` (admin-only, join `persons`+`auth.users`+`grupos`),
   `admin_update_person` (nombre/apellido/teléfono/cédula de cualquier
   persona — puede renombrar la cédula misma, ver abajo),
   `count_active_users`, `update_product_category`, `update_own_profile`
   (autoservicio), `create_grupo`/`update_grupo` (super_admin siempre;
   `update_grupo` también admin normal de SU PROPIO grupo, "Editar mi
   grupo").
10. **Productos ↔ grupo** — `add_product_to_grupo(p_client_id, p_name,
    p_unidad, p_category_id, p_umbral, p_umbral_max, p_qnty, p_client_op_id,
    p_grupo_id)`: busca un producto VIVO en la categoría por nombre+unidad
    (catálogo compartido) y lo reutiliza, o lo crea — mismo patrón
    `begin/exception when unique_violation` que `create_category` (fix
    2026-08-29): si dos grupos agregan el mismo insumo nuevo casi a la vez,
    `products_category_name_unidad_unique_idx` evita la fila duplicada y el
    segundo termina sumándose al producto del primero en vez de fallar.
    `ingresorapido.js#_loadCatalogCache()` (sugerencia "usados por otros
    grupos") reduce cuánto se da esta carrera refrescándose seguido, pero la
    integridad la garantiza esto, no esa caché. Adjunta/revive la fila
    `inventory` de ese grupo y, si `p_qnty ≠ 0`, registra el conteo inicial
    vía movimiento (mismo motor que `apply_count`). `remove_product_from_grupo
    (p_product_client_id, p_grupo_id)`: soft-borra (`inventory.deleted_at`)
    solo el conteo de ese grupo — el producto real y el conteo de otros
    grupos quedan intactos.
11. **Conteo de inventario** — `apply_count`, `uncount_item`,
    `delete_count` — todas ganan `p_grupo_id` (admin/coordinador lo
    resuelven solos vía `current_grupo_id()`; super_admin debe indicarlo) y
    operan sobre `(product_id, grupo_id)`.
12. **Egreso Rápido** — `create_comanda_rapida` (gana `p_grupo_id`; no usa
    `apply_count`; genera comanda + movimiento en una transacción, con
    reserva de stock atómica sobre `(product_id, grupo_id)`),
    `merge_product` (fusiona un insumo duplicado: reatribuye
    `movement_items`/`comanda_items` al destino y fusiona TODAS las filas
    de `inventory` del origen — suma si el destino ya tiene fila para ese
    grupo, repunta si no), vistas `persons_solicitantes`/
    `ubicaciones_genericas_selectable` (sin uso activo desde el cliente —
    ver [04-vistas-ui.md](./04-vistas-ui.md#viewsegresorapidojs--egreso-rápido)).
13. **Despachos** — `list_despachos_pendientes()`,
    `marcar_despacho_entregado(p_item_id)` — código vigente, pestaña
    oculta del lado del cliente (ver
    [04-vistas-ui.md](./04-vistas-ui.md#viewsdespachosjs--oculta-código-dormido)),
    ambas ahora exigen también `can_access_grupo(comandas.grupo_id)`.
14. **Row Level Security** — ver abajo.
15. **Grants de tabla** — `USAGE`/`SELECT` base a `authenticated` en casi
    todo; `INSERT`/`UPDATE` limitados a `products, persons, phones,
    person_status, comms, checkpoints, categories, grupos` (el resto de la
    escritura pasa por RPC `SECURITY DEFINER`); `DELETE` solo en
    `checkpoints` (`categories` YA NO tiene grant de `DELETE` directo — el
    borrado de una categoría huérfana solo puede pasar dentro de
    `delete_category`). `comandas`/`comanda_items`/`inventory`/
    `category_grupos` **no** tienen grants directos de escritura — todo
    pasa por RPC `SECURITY DEFINER`. `anon` no tiene nada — ninguna ruta
    anónima en toda la app.

## Tablas activas vs. dormidas

**Activas** (con policy real de categoría/rol, escritas por los flujos
vigentes del cliente): `categories`, `products`, `inventory`, `movements`,
`movement_items`, `checkpoints`, `comms`, `persons`, `phones`,
`person_status`, `comandas`, `comanda_items` (activas desde que existe
`create_comanda_rapida` — no son parte del dominio dormido).

**Dormidas** (heredadas de un sistema hermano por fidelidad de esquema,
sin flujo propio de GBSInventario que las pueble hoy — policy genérica
"lectura para cualquier sesión, escritura solo admin", aplicada en bloque
vía un `DO` loop en vez de una por una): `comandas_viejas`,
`comanda_imagenes`, `product_aliases`, `municipios`, `parroquias`,
`rutas_ejes`, `ubicaciones`, `ubicacion_contactos`, `ubicacion_imagenes`,
`ubicacion_snapshots`, `conductores`, `conductor_vehiculos`,
`conductor_dias`, `conductor_horarios`, `conductor_zonas`, `facultades`,
`carreras`, `ucevistas`, `afectados`. `requests` tiene su propio esquema y
triggers wireados (paga automáticamente contra un `movement` de entrada)
pero ningún RPC/vista del cliente la lee o escribe hoy — dormida en la
práctica aunque no esté en la lista explícita del script.

## Tablas núcleo

Multi-tenant por **grupo de extensión** (`grupos`, tabla `id`/`nombre`):
cada uno lleva su propio inventario/usuarios/comunicados/directorio.
`super_admin` ve/gestiona todos; `admin`/`coordinador` quedan acotados al
suyo (`app_metadata.grupo_id`).

- **`categories`**: `id`, `nombre` (único global, case-insensitive) —
  catálogo COMPARTIDO entre grupos (revisión "productos multigrupo",
  2026-08-25): ya no tiene `grupo_id` propio, se vincula a los grupos que
  la usan vía **`category_grupos`** (`category_id`, `grupo_id`, PK
  compuesta, M2M). Crear una categoría busca-y-reutiliza por nombre antes
  de duplicar (`create_category`); desvincularla de un grupo no la borra
  mientras algún otro grupo la tenga vinculada.
- **`products`**: `id`, `client_id` (clave de upsert desde el cliente),
  `name`, `category_id` (FK a `categories`), `unidad`, `umbral`,
  `umbral_max`, `updated_at`, `deleted_at`. Catálogo COMPARTIDO por
  categoría (sin `grupo_id` propio) — nombre+unidad únicos POR CATEGORÍA
  (`unique index (category_id, lower(btrim(name)), unidad) where
  category_id is not null and deleted_at is null`), no por grupo: dos
  grupos que necesiten "Arroz / kg" en "Alimentos" comparten la misma fila.
- **`inventory`**: `(product_id, grupo_id)` (PK compuesta), `qnty`,
  `last_counted_at`, `last_counted_by`, `deleted_at`, `updated_at`
  (mantenida por trigger genérico, la usa el pull incremental — ver
  `supabase/2026-08-28-fix-inventory-updated-at.sql`) — el CONTEO de un
  producto **dentro de un grupo**; ya no hay una fila automática por
  producto nuevo, se crea explícitamente vía `add_product_to_grupo` cuando
  ese grupo empieza a contarlo. `deleted_at`: borrado lógico de "este grupo
  quitó el insumo" (el producto real y el conteo de otros grupos no se
  tocan) — revivir es simplemente volver a agregarlo.
- **`movements`** / **`movement_items`**: el ledger genérico de
  entradas/salidas — Ingreso Rápido, ajustes de Insumos y Egreso Rápido
  escriben acá (directa o indirectamente); Historial/Ingresos/Egresos leen
  de acá. `movements.grupo_id` (denormalizado, todo movimiento ocurre
  dentro de un único grupo) resuelve a qué fila de `inventory` afecta cada
  línea y filtra RLS.
- **`persons`**: `ci` (PK), `name`, `surname`, `phone_id` (FK, `NOT NULL`),
  `categoria` (enum heredado, sin uso propio de GBSInventario),
  `auth_user_id` (`NULL` = persona sin inicio de sesión).
- **`phones`**: `id`, `company_code`, `number`, `UNIQUE(company_code, number)`.
- **`comandas`** / **`comanda_items`**: documento de entrega generado por
  `create_comanda_rapida` (`origen='rapida'`) — `comandas.notas` guarda el
  "Destino" de texto libre; `comandas.grupo_id` (denormalizado, mismo
  criterio que `movements.grupo_id`); `comanda_items.producto`/`producto_id`
  son una **foto fija** del momento de creación (no se actualizan si el
  insumo se renombra/fusiona después — por eso `views/egresos.js` lee de
  `movement_items` en vez de acá, ver
  [04-vistas-ui.md](./04-vistas-ui.md#viewsegresosjs--reporte-de-entregas)).
- **`comms`**: avisos internos (Comunicados) — RLS abierta a cualquier
  sesión autenticada, sin filtro de área.
- **`checkpoints`**: existe en el esquema remoto pero **no** se usa desde
  el cliente — los checkpoints de respaldo de esta app viven solo en
  IndexedDB local (`js/checkpoints.js`), no se sincronizan a Supabase.

## RLS

Activa en **todas** las tablas de este esquema, sin excepción.
`categories`/`category_grupos`/`grupos`: lectura abierta a cualquier sesión
autenticada (nombres no son información sensible, hace falta para el
buscador de categorías entre grupos y el switcher de grupo) — la escritura
real vive en las RPC de la sección 9. `products`/`inventory`/`movements`/
`movement_items`/`comandas`/`comanda_items`: lectura filtrada por
`can_access_category()` (catálogo/movimientos de mi categoría) **y**, para
`inventory`/`movements`/`movement_items`/`comandas`/`comanda_items`,
además `can_access_grupo()` sobre la fila concreta (una categoría puede
estar vinculada a más de un grupo). Escritura de `inventory`/`movements`/
`movement_items`/`comandas`/`comanda_items`/`category_grupos` **solo** a
través de una RPC `SECURITY DEFINER` que valida el rol/área/grupo del
actor por dentro (sin policy ni grant de escritura directa); `products`
sí tiene grant directo para el upsert de sync (rename/umbral, sujeto a RLS
por categoría) pero la CREACIÓN de un producto nuevo pasa por
`add_product_to_grupo` (RPC). `persons`/`phones`: cualquier sesión del
mismo grupo lee, solo admin del mismo grupo escribe directo (la escritura
de un coordinador sobre su propia fila pasa por `update_own_profile`, RPC).
`anon` no tiene acceso a nada.

## Renombrar una cédula (`admin_update_person` + migración de FKs)

`persons.ci` es la PK y está referenciada por FK desde más de una decena
de tablas. La migración `2026-08-11-editar-usuario-completo.sql` (y el
bloque equivalente en `new-project-schema.sql`, para que un fresh install
quede igual) recorre `pg_constraint` buscando toda FK cuyo `confrelid` sea
`persons`, y la recrea con `on update cascade` preservando su acción
`on delete` original:

```sql
do $$
declare rec record;
begin
  for rec in
    select con.conname, cl.relname as table_name, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    where con.contype = 'f' and con.confrelid = 'public.persons'::regclass
  loop
    execute format('alter table public.%I drop constraint %I', rec.table_name, rec.conname);
    execute format('alter table public.%I add constraint %I %s on update cascade', rec.table_name, rec.conname, rec.def);
  end loop;
end $$;
```

Con eso, `admin_update_person` puede hacer un simple
`update persons set ci = <nueva> where ci = <vieja>` y Postgres reatribuye
automáticamente todo el historial de esa persona (comandas, movimientos,
etc.) sin tocar tabla por tabla a mano — y sin tener que mantener esa lista
sincronizada si el esquema agrega otra FK hacia `persons(ci)` en el futuro.

## Edge Function (`supabase/functions/manage-users`)

Única pieza del sistema que usa la Admin API de Supabase
(`service_role` key) — crear/editar `app_metadata`/correo/contraseña de
una cuenta de Auth no es alcanzable desde una RPC `SECURITY DEFINER`
corriente. `requireAdmin()` valida el JWT de quien llama en cada request
(nunca confía en el body). Acciones: `grant_login`, `update_area`,
`update_email`, `revoke_access`, `revoke_by_area`, `reset_password`,
`set_active` — ver el detalle de cada una en
[05-autenticacion.md](./05-autenticacion.md#gestión-de-usuarios-viewsvoluntariosjs-admin-only).
Redeploy manual tras tocar el archivo:
`supabase functions deploy manage-users`.

## Migraciones incrementales (`supabase/*.sql`)

Cada archivo fechado en la raíz de `supabase/` es una migración puntual ya
aplicada contra el proyecto vivo, pensada para pegarse entera en el SQL
Editor de Supabase. `new-project-schema.sql` es el único documento que
debe quedar **siempre** consistente con el estado final acumulado (para
que un fresh install no tenga que re-derivar el historial de parches) — al
tocar el esquema, el cambio se hace en ambos lugares: el archivo fechado
nuevo (para el proyecto ya vivo) y directo en `new-project-schema.sql`
(para que un fresh install quede igual).
