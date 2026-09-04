# 5. Autenticación y roles (`js/auth.js`, `js/views/admin.js`, RBAC)

## Modelo de acceso

Login por **correo + contraseña** contra **Supabase Auth real** — no una
RPC de login propia, no un hash gestionado a mano. La cédula sigue siendo
la clave primaria de `persons`, pero deja de ser parte del inicio de
sesión: solo se usa para vincular la fila de `persons` con la cuenta de
Auth (`persons.auth_user_id`) y como identificador estable en el resto de
la app.

Rol y área viven en `app_metadata` del usuario de Auth (nunca en una tabla
que el cliente pueda leer/escribir directo con la anon key) — eso es lo
que hace RLS del lado del servidor y `auth.js` del lado del cliente.

Desde la migración multi-tenant (grupos de extensión, ver
[08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md) y
`PENDIENTE-migracion-schema-sibex.md`) hay **tres** roles, no dos —
`super_admin` es un nivel por encima de `admin`, no un sinónimo:

| Rol + área | Acceso |
|---|---|
| `super_admin` | Ve/administra **todos** los grupos de extensión (selector de grupo en la barra superior, `#grupo-switch`/`#grupo-switch-m`, exclusivo de este rol) y la pestaña **"Grupos"** (alta/gestión de grupos, ver [04-vistas-ui.md](./04-vistas-ui.md#viewsgruposjs--grupos-de-extensión-super-admin-only)). Fuera de eso, tiene el mismo alcance que `admin` **dentro del grupo que esté mirando** — incluida la pestaña Usuarios y editar el inventario. |
| `admin` | Completo dentro de **su propio grupo** de extensión, incluida la pestaña Usuarios (crear/editar/revocar cualquier cuenta no-admin de ese grupo) y Categorías/Respaldos. Sin acceso a "Grupos" ni al selector de grupo — no tiene otro grupo que elegir. |
| `coordinador` con área = una categoría real | Completo pero **recortado a su propia categoría** en Insumos/Ingreso Rápido/Historial/Resumen (`store.visibleItems()`). Sin acceso a Usuarios/Grupos/Categorías/Respaldos. |
| `coordinador` con área `'general'` | Igual que `admin` en la práctica: ve y **administra** el catálogo/Historial/Resumen **completos, sin filtrar** (`auth.canEditInventory()` es `true`, fix 2026-08-28 — antes era de solo consulta). Sin acceso a Usuarios/Grupos/Categorías/Respaldos, a diferencia de `admin`. Área por defecto de todo usuario nuevo (ver §Gestión de usuarios). |
| Cualquier cuenta sin `role` en `app_metadata` | **Denegado por completo** (`hasPlatformAccess()` es `false`). |

`js/auth.js` expone:

- `isLoggedIn()`, `ci()`, `role()`, `area()`, `name()`.
- `isAdmin()` — **`role() === 'admin'` exactamente**, a propósito distinto
  de `isSuperAdmin()` (`role() === 'super_admin'`) — el switcher de Grupos y
  la pestaña "Grupos" quieren distinguir a un super_admin de un admin de
  grupo, no tratarlos igual.
- **`hasAdminRights()`**: `isAdmin() || isSuperAdmin()` — el atajo para
  "puede administrar" cuando **no** hace falta esa distinción (p.ej. la
  pestaña Usuarios, o cualquier RPC que hoy chequee el rol a mano — ver
  advertencia más abajo). Úsalo salvo que el caso concreto sea, como
  Grupos, exclusivo de super_admin.
- `isCoordinador()`.
- **`isGeneral()`**: `isCoordinador() && area() === 'general'`.
- **`canEditInventory()`**: `hasAdminRights() || isCoordinador()` (fix
  2026-08-28 — antes excluía a `isGeneral()`) — el único chequeo que gatea
  cada acción que MODIFICA el inventario; todo lo demás (consulta) usa
  `hasPlatformAccess()`/`visibleItems()` sin distinguir "general" de un
  coordinador normal. Hoy equivale a `hasPlatformAccess()` (todo rol con
  acceso a la plataforma puede editar) — se mantiene como chequeo aparte
  por si en el futuro vuelve a existir un rol de solo lectura.
- **`hasPlatformAccess()`**: `hasAdminRights() || isCoordinador()` — único
  chequeo de acceso a la plataforma.
- `authHeaders(extra={})` — `{apikey, Authorization: 'Bearer <access_token>',
  'Content-Type': 'application/json', ...extra}`, usado por toda llamada
  REST/RPC del resto de la app.

> ⚠️ **Trampa recurrente en las RPCs de escritura del lado del servidor**
> (`supabase/sibex-schema-install.sql`): varias empezaron con un chequeo a
> mano `current_role() not in ('admin', 'coordinador')` escrito **antes**
> de que existiera `super_admin`, y nunca se actualizaron al agregarlo —
> un super_admin podía entonces *crear* un insumo (esa parte sí pasaba por
> RLS, que sí incluye a super_admin) pero se lo rechazaba al fijarle una
> cantidad inicial (`apply_count`), porque esa función seguía sin
> `'super_admin'` en la lista. Corregido en `apply_count`/`uncount_item`/
> `delete_count`/`merge_product`/la política de `person_status` (ver
> `supabase/2026-08-24-super-admin-permisos-inventario.sql`) — **cualquier
> RPC/policy nueva que chequee el rol a mano debe incluir `'super_admin'`
> junto a `'admin'`**, o mejor, usar `sibex.is_admin()` (ya cubre ambos)
> en vez de listar roles sueltos.

## Sesión (`auth.init()` / `_applySession()`)

- Cliente Supabase (`@supabase/supabase-js`, singleton compartido con
  `sync.js` para Realtime).
- `auth.init()`: `supabaseClient.auth.getSession()` → aplica la sesión;
  se suscribe a `onAuthStateChange` (cubre login, logout, y el refresh
  automático de token cada ~55min — no hay que reimplementar nada de eso a
  mano).
- `_applySession(session)`: toma `role`/`area` de `session.user.app_metadata`;
  resuelve `ci`/`name`/`surname`/`phone` con un `GET rest/v1/persons?
  auth_user_id=eq.<uid>&select=ci,name,surname,phones(...)`; si falla
  (offline), cae a una caché en `localStorage` (`gbs-inv-profile-cache`).

## `login(email, password)`

1. `supabaseClient.auth.signInWithPassword({email, password})`.
2. Si tiene éxito pero `hasPlatformAccess()` da `false` (rol vacío o
   despojado por `delete_category`, ver abajo) → `signOut()` inmediato y
   `{ok:false, error:'No tienes acceso a esta plataforma.'}` — no deja
   sesiones "a medias" con token válido pero sin rol.

## `checkAuth()` (`js/app.js`)

Muro de login para cualquiera sin `hasPlatformAccess()`. Defensivo: una
sesión guardada cuyo rol/área ya perdió acceso (p.ej. reasignación en vivo)
se cierra automáticamente antes de mostrar el shell. Cada transición real
login-wall → app-shell navega a **Resumen** (no a la última pestaña que
haya quedado abierta de una sesión anterior en el mismo dispositivo).

### Aislamiento entre cuentas del mismo dispositivo (2026-09-04)

IndexedDB (`js/db.js`) es **un solo almacén compartido por todo el
navegador**, sin separar por usuario/grupo — y el pull de `sync.js` es
incremental (solo agrega deltas nuevos desde el último checkpoint, nunca
"borra" lo que dejó de ser visible). Cerrar sesión y entrar con OTRA cuenta
en el mismo dispositivo, sin recargar la página, dejaba el catálogo de la
sesión anterior pisado encima: `store.visibleItems()` para admin/coordinador
confía en que IndexedDB solo contiene lo de SU grupo (así es en el flujo
normal — RLS ya filtra el pull), así que un admin de un grupo nuevo veía lo
que un super_admin había visto antes en ese mismo navegador (todos los
grupos). El caso inverso también fallaba: tras un login interactivo (sin
recarga de página), nada disparaba un `sync.run()` con el token ya
autenticado — `store.init()` había corrido en `boot()` antes de que
existiera sesión, así que el catálogo se quedaba vacío/incorrecto hasta el
próximo ciclo automático (30s) o un refresco manual.

`checkAuth()` ahora, en cada `freshLogin` (transición login-wall →
app-shell):
1. Compara `auth.session.userId` contra el último uid que inició sesión en
   este navegador (`localStorage['gbs-inv-last-auth-uid']`). Si cambió (o es
   la primera vez), purga el catálogo local (`db.clear()` + `db.logClear()`)
   y el checkpoint de sync (`sync.resetCheckpoint()`) — `queue` NO se toca
   (operaciones pendientes de subir, independientes del catálogo; `_push()`
   corre antes que `_pull()` en `sync.run()`, así que nada se pierde aunque
   la cola pertenezca a la cuenta anterior).
2. Recarga categorías/grupos y fuerza un `sync.run()` completo con el token
   YA autenticado, rehidratando `store.items`/`store.logs` desde IndexedDB —
   sin esperar al próximo ciclo de 30s.

## `applyRBAC()` (`js/app.js`)

- **"Usuarios"** se oculta entera del nav (desktop y móvil) para cualquier
  cuenta sin `hasAdminRights()` (ni admin ni super_admin).
- **"Grupos"** se oculta entera para cualquier cuenta que no sea
  `isSuperAdmin()` — a diferencia de Usuarios, un admin de grupo normal
  tampoco la ve (ya tiene su grupo fijo, no hay nada que gestionar ahí).
- **Móvil**: Usuarios y Grupos comparten una sola pestaña de la bottom nav
  (`[data-page="accesos"]`) con sub-tabs adentro (`#m-subnav-acc`, mismo
  patrón que el merge de Ingresos+Egresos en "Movimientos", ver
  [02-arquitectura-frontend.md](./02-arquitectura-frontend.md#rbac-de-navegación-applyrbac)) —
  en desktop siguen siendo dos `tn-item` separados.
- **"Despachos"** se oculta para todos (feature dormida, ver
  [04-vistas-ui.md](./04-vistas-ui.md)).
- El chequeo de `auth.canEditInventory()` que oculta la pestaña "Ingreso
  Rápido" del switcher (fuerza modo Egreso) queda defensivo desde el fix
  2026-08-28: el coordinador de "general" era el único caso real que
  fallaba esa condición, y ahora administra igual que cualquier otro
  coordinador (ver tabla de roles arriba).

Ver el detalle completo en
[02-arquitectura-frontend.md](./02-arquitectura-frontend.md#rbac-de-navegación-applyrbac).

## Visibilidad de insumos por área (`store.js#visibleItems()`)

Un `coordinador` de categoría real ve solo el catálogo de su propia
categoría; admin y el coordinador de "general" ven el catálogo completo.
100% del lado del cliente (`store.visibleItems()` filtra `store.items` por
`item.categoria === auth.area()`) — `stats()`/`statsByCat()`/`grouped()`/
`csv()` lo heredan sin tocarlos uno por uno. También se aplica en
`views/registro.js` (Historial, filtra el historial por categoría) y
`views/egresorapido.js` (el buscador del carrito solo ofrece insumos de la
propia área).

## Gestión de usuarios (`views/voluntarios.js`, admin/super_admin)

Ver el detalle de la UI en
[04-vistas-ui.md](./04-vistas-ui.md#viewsvoluntariosjs--usuarios-admin-only).
Resumen del reparto entre RPC normal y Edge Function:

| Operación | Mecanismo | Por qué |
|---|---|---|
| Crear persona (nombre/apellido/teléfono/cédula) | RPC `create_person` | Columnas de `persons`, cubiertas por RLS normal. |
| Editar persona (incl. renombrar cédula) | RPC `admin_update_person` | Ídem — no toca `auth.users`. |
| Otorgar acceso (crea cuenta de Auth) | Edge Function `manage-users#grant_login` | Requiere la Admin API (`service_role`). |
| Editar área/rol | Edge Function `manage-users#update_area` | `app_metadata`, solo alcanzable con Admin API. |
| Editar correo | Edge Function `manage-users#update_email` | Vive en `auth.users.email`, no en `persons`. |
| Resetear contraseña de otro usuario | Edge Function `manage-users#reset_password` | Admin API; a diferencia de "Cambiar mi contraseña" (autoservicio), no pide la contraseña actual — el admin ya demostró el permiso. |
| Activar/desactivar | Edge Function `manage-users#set_active` | Baneo nativo de Auth (`banned_until`). |
| Revocar acceso | Edge Function `manage-users#revoke_access` | Limpia `app_metadata` + cierra sesión activa (`signOut` scope `'global'`). |
| Revocar por área (al borrar una categoría) | Edge Function `manage-users#revoke_by_area` | Llamado por `delete_category` indirectamente (ver abajo) — invalida sesiones de golpe. |

**Área oculta al crear (fix 2026-08-28)**: el formulario de "Otorgar
acceso" ya no muestra el `<select>` de Área — todo usuario nuevo se crea
con área `'general'` (primera opción de `_areaOptionsHTML()`, queda
seleccionada sin tocar nada; el campo sigue en el DOM, solo oculto, por si
se reactiva más adelante). Es lo que hace necesario que `'general'`
administre igual que cualquier otro coordinador (ver `canEditInventory()`
arriba) — de seguir siendo de solo lectura, ningún usuario nuevo podría
tocar el inventario. El modal de **editar** un usuario existente sí
conserva el selector de Área intacto.

`requireAdmin()` en la Edge Function valida el JWT del que llama contra
`app_metadata.role === 'admin'` en cada request — nunca confía en un campo
del body. `service_role` key vive solo como secreto de la función
(`SUPABASE_SERVICE_ROLE_KEY`), jamás llega al navegador.

### Renombrar una cédula (`admin_update_person`)

`persons.ci` es la clave primaria y está referenciada por FK desde más de
una decena de tablas (`comandas`, `movements`, `conductores`, `ubicaciones`,
etc.). Todas esas FKs se migraron a `on update cascade` recorriendo
`pg_constraint` (sin listar tablas a mano, ni tener que mantener la lista
sincronizada si el esquema agrega otra FK hacia `persons(ci)` más
adelante) — ver
[08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md). Con eso,
`admin_update_person` simplemente hace `update persons set ci = <nueva>
where ci = <vieja>` y Postgres reatribuye automáticamente todo el
historial de esa persona.

### `delete_category`

Si un admin borra una categoría, la RPC despoja `role`/`area` de
`app_metadata` de cualquier coordinador asignado a ella del lado del
servidor (no solo deja de mostrarla en el cliente) — equivalente a un
`revoke_access` en lote, para que nadie quede con un `area` apuntando a una
categoría que ya no existe.

## Cómo el resto del sistema usa esto

- `js/sync.js` — headers siempre con `auth.authHeaders()` (access_token
  real, no solo la anon key — RLS necesita `auth.uid()`). Ver
  [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md).
- `js/views/ingresorapido.js` — el nombre del "contador" se deriva de
  `auth.name()` si no se fijó manualmente.
- `js/views/registro.js`/`ingresos.js`/`egresos.js` — filtran por área
  cuando corresponde (ver arriba).
