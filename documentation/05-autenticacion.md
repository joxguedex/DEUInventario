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

| Rol + área | Acceso |
|---|---|
| `admin` | Completo, incluida la pestaña Usuarios (crear/editar/revocar cualquier cuenta no-admin) y Categorías/Respaldos. |
| `coordinador` con área = una categoría real | Completo pero **recortado a su propia categoría** en Insumos/Ingreso Rápido/Historial/Resumen (`store.visibleItems()`). Sin acceso a Usuarios/Categorías/Respaldos. |
| `coordinador` con área `'general'` | **Solo consulta**: ve el catálogo/Historial/Resumen **completos, sin filtrar** (mismo alcance que admin), pero no puede sumar/restar/crear/eliminar insumos ni borrar registros de Historial (`auth.canEditInventory()` es `false`). Sí puede usar Egreso Rápido con el catálogo completo. |
| Cualquier cuenta sin `role` en `app_metadata` | **Denegado por completo** (`hasPlatformAccess()` es `false`). |

`js/auth.js` expone:

- `isLoggedIn()`, `ci()`, `role()`, `area()`, `name()`.
- `isAdmin()` / `isCoordinador()`.
- **`isGeneral()`**: `isCoordinador() && area() === 'general'`.
- **`canEditInventory()`**: `isAdmin() || (isCoordinador() && !isGeneral())`
  — el único chequeo que gatea cada acción que MODIFICA el inventario; todo
  lo demás (consulta) usa `hasPlatformAccess()`/`visibleItems()` sin
  distinguir "general" de un coordinador normal.
- **`hasPlatformAccess()`**: `isAdmin() || isCoordinador()` — único chequeo
  de acceso a la plataforma.
- `authHeaders(extra={})` — `{apikey, Authorization: 'Bearer <access_token>',
  'Content-Type': 'application/json', ...extra}`, usado por toda llamada
  REST/RPC del resto de la app.

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

## `applyRBAC()` (`js/app.js`)

- **"Usuarios"** se oculta entera del nav (desktop y móvil) para cualquier
  cuenta que no sea admin.
- **"Despachos"** se oculta para todos (feature dormida, ver
  [04-vistas-ui.md](./04-vistas-ui.md)).
- El coordinador de "general" pierde la pestaña "Ingreso Rápido" del
  switcher (fuerza modo Egreso) — consultar sí, editar el inventario
  propio no aplica (no tiene categoría propia).

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

## Gestión de usuarios (`views/voluntarios.js`, admin-only)

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
