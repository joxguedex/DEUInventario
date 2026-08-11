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
7. **Triggers** — `set_updated_at` (genérico), `create_inventory_row`
   (auto-crea la fila de `inventory` por producto nuevo),
   `apply_movement_item`/`apply_movement_item_changes` (ajustan
   `inventory.qnty` en INSERT/UPDATE/DELETE de `movement_items` —
   `apply_count`/`uncount_item`/`delete_count` **no** tocan `qnty` a mano,
   el trigger ya lo hace), `movement_has_items` (todo movimiento necesita
   ≥1 línea), más triggers menores de `requests`/`phones`.
8. **Autenticación** — helpers de rol/área a partir del JWT de Supabase
   Auth: `current_role()`, `current_area()`, `is_admin()`,
   `is_coordinador()`, `current_person_ci()`, `current_category_id()`,
   `can_access_category(p_category_id)`, `actor_note(p_tipo)` (arma
   `"Nombre - Área - Tipo"`, el formato que lee Historial/Ingresos/Egresos
   para inferir el tipo de movimiento), `link_person_login` (solo
   invocable por la Edge Function), `create_person`.
9. **Categorías** — `create_category`/`update_category`/`delete_category`
   (admin-only; borrar bloquea si aún hay productos asignados, y despoja
   `role`/`area` de cualquier coordinador de esa categoría),
   `list_users_with_access` (admin-only, join `persons`+`auth.users`),
   `admin_update_person` (nombre/apellido/teléfono/cédula de cualquier
   persona — puede renombrar la cédula misma, ver abajo),
   `count_active_users`, `update_product_category`, `update_own_profile`
   (autoservicio).
10. **Conteo de inventario** — `apply_count`, `uncount_item`,
    `delete_count`.
11. **Egreso Rápido** — `create_comanda_rapida` (no usa `apply_count`;
    genera comanda + movimiento en una transacción, con reserva de stock
    atómica), `merge_product` (fusiona un insumo duplicado, reatribuye
    `movement_items` al destino), vistas `persons_solicitantes`/
    `ubicaciones_genericas_selectable` (sin uso activo desde el cliente —
    ver [04-vistas-ui.md](./04-vistas-ui.md#viewsegresorapidojs--egreso-rápido)).
12. **Despachos** — `list_despachos_pendientes()`,
    `marcar_despacho_entregado(p_item_id)` — código vigente, pestaña
    oculta del lado del cliente (ver
    [04-vistas-ui.md](./04-vistas-ui.md#viewsdespachosjs--oculta-código-dormido)).
13. **Row Level Security** — ver abajo.
14. **Grants de tabla** — `USAGE`/`SELECT` base a `authenticated` en casi
    todo; `INSERT`/`UPDATE` limitados a `products, persons, phones,
    person_status, comms, checkpoints, categories` (el resto de la
    escritura pasa por RPC `SECURITY DEFINER`); `DELETE` solo en
    `checkpoints, categories`. `comandas`/`comanda_items` **no** tienen
    grants directos — todo pasa por `create_comanda_rapida`/
    `marcar_despacho_entregado`. `anon` no tiene nada — ninguna ruta
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

- **`categories`**: `id`, `nombre` — reemplaza por completo cualquier enum
  fijo de categorías; cada organización crea/edita/borra las suyas
  (admin-only) desde `admin.js`.
- **`products`**: `id`, `client_id` (clave de upsert desde el cliente),
  `name`, `category_id` (FK a `categories`), `unidad`, `umbral`,
  `updated_at`, `deleted_at`.
- **`inventory`**: `product_id` (PK/FK), `qnty`, `last_counted_at`,
  `last_counted_by` — una fila por producto, creada automáticamente por
  trigger al insertar el producto.
- **`movements`** / **`movement_items`**: el ledger genérico de
  entradas/salidas — Ingreso Rápido, ajustes de Insumos y Egreso Rápido
  escriben acá (directa o indirectamente); Historial/Ingresos/Egresos leen
  de acá.
- **`persons`**: `ci` (PK), `name`, `surname`, `phone_id` (FK, `NOT NULL`),
  `categoria` (enum heredado, sin uso propio de GBSInventario),
  `auth_user_id` (`NULL` = persona sin inicio de sesión).
- **`phones`**: `id`, `company_code`, `number`, `UNIQUE(company_code, number)`.
- **`comandas`** / **`comanda_items`**: documento de entrega generado por
  `create_comanda_rapida` (`origen='rapida'`) — `comandas.notas` guarda el
  "Destino" de texto libre; `comanda_items.producto`/`producto_id` son una
  **foto fija** del momento de creación (no se actualizan si el insumo se
  renombra/fusiona después — por eso `views/egresos.js` lee de
  `movement_items` en vez de acá, ver
  [04-vistas-ui.md](./04-vistas-ui.md#viewsegresosjs--reporte-de-entregas)).
- **`comms`**: avisos internos (Comunicados) — RLS abierta a cualquier
  sesión autenticada, sin filtro de área.
- **`checkpoints`**: existe en el esquema remoto pero **no** se usa desde
  el cliente — los checkpoints de respaldo de esta app viven solo en
  IndexedDB local (`js/checkpoints.js`), no se sincronizan a Supabase.

## RLS

Activa en **todas** las tablas de este esquema, sin excepción. Patrón para
las tablas core (`products`/`inventory`/`movements`/`movement_items`/
`comandas`/`comanda_items`/`categories`): lectura filtrada por categoría
vía `can_access_category()`, escritura **solo** a través de una RPC
`SECURITY DEFINER` que valida el rol/área del actor por dentro (nunca un
`INSERT`/`UPDATE`/`DELETE` directo del cliente sobre esas tablas, salvo
`products` que sí tiene grant directo para el upsert de sync — igual
sujeto a RLS por categoría). `persons`/`phones`: cualquier sesión lee,
solo admin escribe directo (la escritura de un coordinador sobre su propia
fila pasa por `update_own_profile`, RPC). `anon` no tiene acceso a nada.

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
