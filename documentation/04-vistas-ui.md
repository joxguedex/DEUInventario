# 4. Vistas / UI (`js/views/*.js`, `js/components/*.js`)

Cada vista es un módulo con una función `render*(rootEl)` que reemplaza el
`innerHTML` del contenedor y conecta sus propios listeners — no hay
framework de componentes ni virtual DOM, todo es DOM imperativo con
template strings.

## `views/conteo.js` — Insumos

Catálogo completo, filtrable por búsqueda y por categoría.

- **Buscador** (`#cnt-q`, debounce 150ms, `normSearch`).
- **Selector de categorías** (`.tabs`/`.tab`, `_paintTabs()`): "Todos" + una
  pestaña por categoría (`store.categories`), más "+ categoría" al final
  (solo admin, delega en `store.createCategory`). **Se oculta entero para
  un coordinador de área específica** — `store.visibleItems()` ya lo limita
  a su propia categoría del lado del cliente, así que el selector no
  filtraría nada real; admin y el coordinador de "general" sí lo ven.
- **Grilla de tarjetas** (`.inv-grid`/`.inv-card`): nombre, categoría,
  cantidad, barra de progreso coloreada por estado (`iStatus`/`iPct`),
  controles `−`/input/`+` (con debounce), y un ícono de lápiz junto a los
  controles que abre **"Editar insumo"** (`_openEditItem`) — modal único
  con nombre (+ búsqueda de fusión con un insumo ya existente, si el nombre
  coincide con otro), categoría (admin-only), cantidad, umbral y eliminar.
  Sin `auth.canEditInventory()`, la tarjeta es de solo lectura (sin
  controles ni lápiz).

## `views/ingresorapido.js` — Ingreso Rápido

Offline-first, respaldado por IndexedDB. Reemplaza el viejo panel único
"Agregado Rápido": ya no permite restar (para eso está Egreso Rápido).

- Buscador (debounce 110ms) → sugerencias (top 8, coincidencia de prefijo
  primero) con un botón "Crear '<texto>'" al final.
- **Insumo existente**: total actual + input de cantidad + "Sumar" →
  `store.registrar(id, n, {origen:'ingreso'})`.
- **Insumo nuevo**: nombre, categoría (`<select>` filtrado a la propia área
  para un coordinador), unidad, umbral (default 10), cantidad inicial →
  `store.addNuevo(...)`. Si no hay categorías creadas todavía, bloquea la
  creación con un aviso en vez de mostrar un `<select>` vacío.
- **`openSheet()`/`closeSheet()`** — hoja inferior en móvil (clase `.open`
  + backdrop + `body.qa-lock`).
- **Herramientas admin** (`.qa-admin-tools`, solo `auth.isAdmin()`, en el
  pie compartido del panel):
  - **Exportar JSON** — dump completo de IndexedDB.
  - **Refrescar local** — `sync.pullAll()` (re-pull completo).
  - **Exportar Excel** — `store.visibleItems()` no eliminados a `.xlsx`.
  - **Importar Excel** — lee un `.xlsx`/`.xls`/`.csv` (columnas
    Nombre+Cantidad requeridas), matchea categoría por nombre, confirma, y
    llama `store.addNuevo(...)` por fila.
  - **Máquina del tiempo** — atajo directo al panel de respaldos de
    `admin.js`.

## `views/egresorapido.js` — Egreso Rápido

Online-only: genera una comanda real (`create_comanda_rapida`), no un
ajuste de conteo. Bypasa la cola de sync por completo — el descuento de
stock ocurre en el servidor (trigger sobre `movement_items`), y como la RPC
no pasa por `sync.enqueue`, el módulo aplica un parche local manual sobre
`store.items` tras confirmar (para que la tarjeta en Insumos refleje el
nuevo stock sin esperar al próximo pull incremental).

- **Carrito** (`_rows`): búsqueda de producto por fila (excluye ítems sin
  `db_id`, es decir, no sincronizados todavía), cantidad por fila con aviso
  si excede el stock disponible.
- **Destino** (`#eg-destino`) — campo de texto libre, obligatorio para
  poder enviar. Reemplaza a un selector de Solicitante que existió antes:
  no había forma de ver/editar las personas creadas desde ese flujo, así
  que se sacó por completo. El texto viaja como `p_note` → se guarda en
  `comandas.notas` del lado del servidor.
- **Envío** (`_submit`): `p_solicitante_ci: null` siempre (columna
  conservada en el esquema pero sin uso desde el cliente), `p_items`,
  `p_client_op_id` (uid estable entre reintentos, para idempotencia), y
  `p_note` = destino. Requiere `sync.online` — sin conexión, el botón queda
  deshabilitado con un aviso.
- El estado online/offline se vigila con `sync.onChange`, pero **nunca**
  dispara un repintado completo (`_paint()`) — solo actualiza el aviso y el
  estado del botón — para no perder lo que el usuario tenga a medio
  escribir (destino, buscador, cantidad de una fila) en cada ciclo de sync
  de fondo (cada 30s).

## `views/registro.js` — Historial

Nombre de pestaña "Historial" (el módulo/CSS internos siguen usando
`registro`/`reg-*` — solo cambió el texto visible). Bitácora cronológica de
cada movimiento (Recepción/Conteo/Egreso), agrupada por día y filtrable por
tipo.

- Trae el historial completo directo desde Supabase
  (`GET rest/v1/movement_items` con `select` anidado a `movements` y
  `products`, `limit=500`, orden descendente por `id`), reconstruyendo el
  signo del delta desde `movements.direction`. Si falla o no hay red, cae a
  `store.activeLogs()` local.
- Un coordinador de área específica solo ve movimientos de su propia
  categoría (filtro por `categoria === auth.area()`); admin y el
  coordinador de "general" ven todo.
- Cada fila (`_rowHTML`): hora, punto de color por categoría, nombre + tag
  de tipo, quién, delta con signo, y un botón de borrar/corregir
  (`.reg-del`, solo con `auth.canEditInventory()`) que llama a
  `store.deleteLog(id, fallback)`.
- **`focusRegistro(tipo, date)`** (exportada) — preselecciona el filtro de
  tipo y hace scroll (`data-day` en cada grupo) hasta el día indicado.
  Llamada por `app.js` cuando se navega acá desde la flecha "Ver en
  Historial" de una tarjeta de Ingresos/Egresos.

## `views/ingresos.js` — Reporte de recepciones

Solo lectura, sin mirror en IndexedDB (se cachea en memoria por sesión y se
refresca al abrir la pestaña o tras un ciclo de sync). Cuentan como
"ingreso" los movimientos `direction=in` cuyo `note` termina en
`" - Recepción"` — los ajustes hechos desde Insumos quedan fuera a
propósito, para no inflar el reporte con correcciones que no son
recepciones reales.

- **Estadísticas generales**: unidades recibidas, registros, insumos
  distintos, promedio diario.
- **Tarjeta por día** (`.ing-diary-card`): top-3 insumos del día, con una
  **flecha "Ver en Historial"** (`.idc-hist-btn`, esquina superior derecha,
  `data-nav="registro" data-tipo="Recepción" data-date="<día>"`) que salta
  directo a Historial con ese filtro/día ya aplicados — para poder
  ubicar y corregir/borrar un registro puntual sin buscarlo a mano. Un
  click en el resto de la tarjeta abre el **modal de detalle** del día
  (barras "lo más recibido" + línea de tiempo + exportar a Excel).

## `views/egresos.js` — Reporte de entregas

Mismo formato visual que `ingresos.js` (tarjetas por día + modal de
detalle, mismas clases CSS `.ing-*`/`.idc-*`/`.idm-*`), pero con la
semántica invertida (cantidades en rojo con signo `-`) y con el **Destino**
de cada entrega como dato central (viene de `comandas.notas`, mostrado en
el detalle de cada registro de la línea de tiempo).

**Fuente de datos**: `movement_items`/`movements` (igual que Ingresos e
Historial), filtrado por `direction=out` y `note like '*- Egreso'`, con
`comandas` embebido bajo `movements` (`comandas.movement_id → movements.id`)
para traer el Destino. **Deliberadamente no usa `comanda_items`** — esa
tabla guarda una foto fija del nombre del producto al momento de crear la
comanda, que nunca se actualiza si el insumo se renombra o se fusiona con
otro después (`merge_product`); `movement_items` → `products.name` es un
join en vivo, así que un egreso viejo siempre refleja el nombre actual del
insumo (incluido después de un merge), sin necesitar ninguna migración de
datos.

## `views/resumen.js` — Hero + estadísticas

Pestaña por defecto al iniciar sesión.

- **Hero "Centro Operativo"** (`.hero`): marca de agua = `APP_NAME_BOLD`
  (branding.js); el título "Centro Operativo" en sí es texto fijo (no
  parametrizado); subtítulo = `HERO_DESCRIPTION` (branding.js); tres pills
  — usuarios activos (async, `store.countActiveUsers()`), insumos bajo
  umbral, avisos (`store.activeCommunications.length`). Fondo
  `background:var(--amber)`, sigue `--brand-primary` automáticamente.
- **Tarjetas de estadísticas**: unidades totales, categorías, bajo umbral,
  usuarios activos.
- **Desglose por categoría**: barra proporcional por categoría
  (`store.statsByCat()`), con enlace "Ver todo →" a Insumos.
- **Comunicados recientes**: top-3 `store.activeCommunications`, solo
  lectura (resolver vive en la propia pestaña Comunicados), enlace "Ver
  todos →".

## `views/comunicados.js` — Avisos internos

- Modelo: `{id, titulo, cuerpo, urgencia, autor, activo, fecha}`.
  `autor` nunca es texto libre: se calcula como `"Nombre - Área"` (o
  `"Administrador"`) desde la sesión activa.
- Publicar: cualquier admin/coordinador (`#m-comm`, modal genérico de
  `components/modal.js`). Resolver (marcar `activo:false`): solo admin.
- Filtros: todos / info / urgente / crítico / resueltos.
- Polling cada 25s (`initComunicados`): recarga, detecta comunicados
  nuevos desde la última lectura y muestra un toast (sin bombardear con el
  backlog en la primera carga tras un login), actualiza el badge del nav
  (`#nb-comms`/`#nb-comms-mobile`).

## `views/voluntarios.js` — Usuarios (admin/super_admin)

Pestaña oculta del nav para cualquier cuenta sin `auth.hasAdminRights()`
(ver
[02-arquitectura-frontend.md](./02-arquitectura-frontend.md#rbac-de-navegación-applyrbac);
el mensaje interno "Solo para administradores" se conserva como respaldo
por si se llega acá de otra forma). Un `super_admin` gestiona los usuarios
del grupo que tenga elegido en el selector de grupo de la barra superior
(`store.viewingGrupoId`); un `admin` normal solo ve/gestiona su propio
grupo, sin selector. En móvil comparte pestaña de bottom nav con "Grupos"
(`[data-page="accesos"]`, sub-tab "Usuarios" — ver
[views/grupos.js](#viewsgruposjs--grupos-de-extensión-super-admin-only) más
abajo).

Separa dos cosas que antes eran un solo paso:

1. **Datos de la persona** (nombre/apellido/teléfono/cédula) — RPCs
   normales (`create_person`, `admin_update_person`), columnas de
   `persons`, sin necesitar la Admin API.
2. **Acceso** (cuenta de Auth, rol/área/correo, contraseña) — exige la
   Admin API (`service_role` key), vive en la Edge Function
   `supabase/functions/manage-users`, nunca en una RPC alcanzable con la
   sola anon/authenticated key.

**Alta** (`#vol-form`): cédula, nombre, apellido, teléfono, correo,
contraseña, área — un solo submit hace `create_person` (RPC) seguido de
`grant_login` (Edge Function; rol siempre `coordinador`, un admin nuevo se
crea directo contra la base).

**Edición** (`#vol-edit-modal`, `window.editVolunteer(ci)`) — edita **toda**
la información de un usuario existente: nombre, apellido, **cédula**,
teléfono, correo, área y (opcional) contraseña. Al guardar:

1. `admin_update_person` (RPC) — nombre/apellido/teléfono, y si la cédula
   cambió, la renombra (ver abajo).
2. `update_email` (Edge Function) + `update_area` (Edge Function) + si se
   escribió algo, `reset_password` (Edge Function) — usando ya la cédula
   **nueva**.

Renombrar la cédula es delicado: es la clave primaria de `persons` y está
referenciada por FK desde más de una decena de tablas (comandas,
movements, conductores, ubicaciones, etc.). Todas esas FKs se migraron a
`on update cascade` (recorriendo `pg_constraint`, sin listar tablas a
mano — ver [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md)),
así que un solo `update persons set ci = ...` dentro de `admin_update_person`
reatribuye automáticamente todo el historial de esa persona a la nueva
cédula.

**Listado** (`list_users_with_access`, RPC): todos los usuarios con acceso
(rol no nulo, excluye admins), con nombre/correo/rol/área/teléfono/activo.
Por fila: Editar, Activar/Desactivar (`set_active`, baneo nativo de Auth,
reversible sin reconfigurar nada), Revocar (`revoke_access`, limpia rol/área
y cierra sesión de inmediato — no borra la persona ni su cuenta, se puede
volver a otorgar acceso después).

## `views/grupos.js` — Grupos de extensión (super_admin-only)

Pestaña oculta del nav para cualquier cuenta que no sea `auth.isSuperAdmin()`
(ver
[02-arquitectura-frontend.md](./02-arquitectura-frontend.md#rbac-de-navegación-applyrbac)
y [05-autenticacion.md](./05-autenticacion.md)) — un admin de grupo ya tiene
el suyo fijo, no hay nada que gestionar acá. Antes vivía como una sección
más dentro del panel de cuenta (`admin.js`); pasó a ser su propia pestaña
para que dar de alta una organización entera no quedara escondido.

- **Tarjetas** (`.grp-list`/`.grp-card`, `store.grupos`): avatar de color
  (inicial del nombre), nombre, badge "En gestión ahora" si coincide con
  `store.viewingGrupoId`, y dos acciones — **"Gestionar"** (`onManage`,
  cableado en `app.js#nav()`: fija ese grupo en el selector de la barra
  superior vía `store.setViewingGrupo` y salta a la pestaña Usuarios) y
  **"Renombrar"** (`promptDialog` + `store.renameGrupo`).
- **Crear grupo** (`#grp-form`): un solo campo de nombre → `store.createGrupo`.
- **Stats**: grupos totales, y cuál está "en gestión ahora" (el elegido en
  el selector, o "Todos" si no hay ninguno fijado).
- **Móvil**: comparte pestaña de bottom nav con Usuarios
  (`[data-page="accesos"]`, sub-tab "Grupos" — oculto en el sub-tab para
  cuentas no-super_admin, ver `app.js#applyRBAC()`); en desktop sigue
  siendo su propio `tn-item`.

## `views/despachos.js` — oculta, código dormido

Pestaña completamente oculta del nav para todos los roles (ver
[02-arquitectura-frontend.md](./02-arquitectura-frontend.md)) — sin uso real
con el estado actual del sistema. El módulo y las RPCs que consume
(`list_despachos_pendientes`/`marcar_despacho_entregado`) siguen intactos,
más rápido de reactivar (quitar la regla CSS que la oculta) que de rehacer
si algún día hace falta un flujo de despacho por área.

## `views/admin.js` — login wall + panel de perfil

- **`renderLoginWall(container)`** — formulario **correo + contraseña**
  (`#adm-email`/`#adm-pass`), llama `auth.login(email, password)`.
- **Panel** (botón de perfil, cualquier sesión):
  1. **"Mi perfil"** — nombre/apellido/teléfono propios, vía RPC
     `update_own_profile` (autoservicio, solo la fila del propio usuario).
     Cédula visible mostrada de solo lectura (no editable — solo un admin
     puede renombrarla, y solo la de otro usuario, desde Usuarios).
  2. **"Cambiar contraseña"** — autoservicio, `auth.updatePassword()`
     (Supabase Auth: la sesión ya es prueba de identidad, no pide la
     contraseña actual).
  3. **Admin-only — "Categorías de insumos"**: CRUD completo (listar,
     crear, renombrar vía `promptDialog`, borrar vía `confirmDialog`
     danger) sobre `store.categories`.
  4. **Admin-only — "Respaldos del conteo"**: lista de checkpoints
     (`checkpoints.js`) con crear/restaurar/borrar, confirmación danger
     para restaurar.
  5. Cerrar sesión.

## `components/toast.js`, `components/modal.js`, `components/confirm.js`

- **`toast.js`** — `toast.ok/err/info(msg)`: crea un `<div>` en
  `.toast-wrap` (on-demand), lo anima con `.in` y lo remueve tras ~2.6s.
- **`modal.js`** — gestor genérico de `.modal-ov` (usado por el modal de
  Comunicados): `modal.open(id)`/`close(id)`/`closeAll()`, `modal.init()`
  engancha click-fuera, Escape y cualquier `[data-close]`. `admin.js` tiene
  su propio sistema de modal paralelo (`#adm-modal`), no usa este.
- **`confirm.js`** — `confirmDialog({title, body, confirmText, cancelText,
  danger})` y `promptDialog({title, label, value, ...})`, reemplazos
  Promise-based de `confirm()`/`prompt()` nativos del navegador — **ninguna
  confirmación de la app usa el diálogo nativo del navegador**. Comparten
  un overlay `#confirm-modal` con z-index más alto que `.adm-ov`, para
  poder stackear sobre un modal admin ya abierto (p.ej. "Eliminar" dentro
  de "Editar insumo").
