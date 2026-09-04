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
  controles ni lápiz). Catálogo COMPARTIDO entre grupos (revisión
  "productos multigrupo", 2026-08-25): una fila es un CONTEO
  `(producto, grupo)`, no un producto — cuando el visor ve más de un grupo
  a la vez (super_admin sin uno elegido en la barra superior) cada tarjeta
  agrega la etiqueta del grupo dueño de ese conteo.
  **Tarjeta agregada** (`aggregateCardHtml()`, fix 2026-08-30): cada
  producto con fila en 2+ grupos visibles (`store.siblings()`) se COLAPSA
  en una sola tarjeta — de solo lectura (sin `.ic-controls`/`.ic-quickadd`,
  no hay una sola fila de `inventory` a la que aplicarle un cambio), estilo
  distinguible (`.inv-card-agg`, borde punteado), con el total sumado entre
  todos los grupos y el estado/color evaluados contra ESE total (mismo
  `umbral`/`umbral_max`, que viven en `products` — son iguales en todas las
  filas del producto). `data-id="agg:<productClientId>"` la distingue de
  una tarjeta real en `syncView()`/`refreshItem()` (`data-agg="1"`) — se
  repinta tras cualquier cambio a una de sus filas (`_refreshAggCard()`),
  pero solo si ya estaba en el DOM: si un producto recién pasa a tener 2+
  grupos en la sesión, la tarjeta aparece en el próximo `renderList()`
  completo (cambio de pestaña/búsqueda/categoría), no a mitad de grilla.
  **Desplegable** (fix 2026-08-30b, `_expandedProducts`): tocar la tarjeta
  agregada (`data-action="toggle-agg"`, teclado Enter/Espacio también)
  muestra/oculta detrás las tarjetas reales de cada grupo — colapsado por
  defecto, así un producto compartido por N grupos no ocupa N+1 tarjetas de
  entrada. El estado desplegado/colapsado vive en memoria por sesión (no
  persiste), mismo criterio que `_expandedDays` en `registro.js`.
  "Eliminar" ya no borra el producto: solo quita (borrado lógico) el conteo
  de TU grupo — el producto y el conteo de otros grupos quedan intactos, y
  volver a agregarlo lo revive.

## `views/ingresorapido.js` — Ingreso Rápido

Offline-first, respaldado por IndexedDB. Reemplaza el viejo panel único
"Agregado Rápido": ya no permite restar (para eso está Egreso Rápido).

- Buscador (debounce 110ms) → sugerencias (top 8, coincidencia de prefijo
  primero, de MI grupo) + hasta 5 sugerencias "usados por otros grupos"
  (catálogo compartido — `_loadCatalogCache()`, productos de mis
  categorías que otro grupo ya cuenta y el mío todavía no), **antes** del
  botón "Crear '<texto>'" al final.
  `_loadCatalogCache()` corría UNA sola vez, en `renderIngresoRapido()`
  dentro de `boot()` — casi siempre ANTES de que existiera sesión (RLS de
  `products` exige `authenticated`), así que la caché quedaba vacía para
  siempre y esta sección nunca aparecía (fix 2026-08-28). Ahora también se
  recarga desde `resetIngresoRapido()` (login fresco/cambio de grupo, ver
  `app.js#checkAuth()`/`#_onGrupoChange()`) y en cada ciclo de sync
  (`sync.onChange`, automático cada 30s o antes por Realtime — fix
  2026-08-29) para acortar la ventana en la que dos grupos ven "hueco" el
  mismo insumo nuevo. Esto es solo UX: la integridad (que no queden dos
  filas de `products` duplicadas si aun así chocan) la garantiza
  `add_product_to_grupo` del lado del servidor — ver más abajo. También se
  recarga de inmediato (`refreshCatalogCache()`, fix 2026-08-30) al vincular
  o crear una categoría (`store.createCategory` dispara
  `store.onCategoriesChanged()`, cableado en `app.js#boot()` para no crear
  un import circular con `admin.js`) — antes había que esperar el próximo
  ciclo de sync para que la categoría nueva sumara sus productos a la caché.
  **Bug aparte que sí la vaciaba del todo para `super_admin`** (fix
  2026-08-29): el filtro `mine` (insumos que "ya cuento", para no
  resugerirlos) se armaba con `store.items` directo — para un super_admin
  eso trae TODOS los grupos a la vez (RLS lo deja ver todo), así que
  cualquier producto ya contado por CUALQUIER grupo quedaba excluido, y la
  sección de "otros grupos" terminaba vacía casi siempre. Corregido a
  `store.visibleItems()` (ya filtrado al grupo elegido en la barra
  superior, mismo criterio que el resto de las sugerencias).
- **Insumo existente (mi grupo)**: total actual + input de cantidad +
  "Sumar" → `store.registrar(id, n, {origen:'ingreso'})`.
- **Sugerencia de otro grupo**: abre el mismo formulario de "insumo nuevo"
  pero con nombre/categoría/unidad/umbral bloqueados (ya son los del
  producto real) — solo falta la cantidad; al confirmar, `store.addNuevo`
  llama a `add_product_to_grupo`, que reutiliza el producto compartido en
  vez de crear uno nuevo.
- **Insumo nuevo (desde cero)**: nombre, categoría (`<select>` filtrado a
  la propia área para un coordinador), unidad, umbral (default 10),
  cantidad inicial → `store.addNuevo(...)`. Si no hay categorías creadas
  todavía, bloquea la creación con un aviso en vez de mostrar un `<select>`
  vacío.
- **Bloqueado para `super_admin` con "Todos los grupos"** (`_blocked()`,
  fix 2026-08-28): sin un grupo puntual elegido en la barra superior
  (`store.viewingGrupoId == null`) no hay un inventario concreto al que
  sumarle cantidad — el panel muestra un aviso en vez del buscador, en
  lugar de dejar que la RPC lo rechace recién al guardar. Se repinta al
  cambiar de grupo (`app.js#_onGrupoChange` llama a `resetIngresoRapido()`).
- **`openSheet()`/`closeSheet()`** — hoja inferior en móvil (clase `.open`
  + backdrop + `body.qa-lock`).
- **Herramientas admin** (`.qa-admin-tools`, `auth.hasAdminRights()` —
  admin o super_admin, en el pie compartido del panel):
  - **Exportar JSON** — dump completo de IndexedDB.
  - **Refrescar local** — `sync.pullAll()` (re-pull completo).
  - **Exportar Excel** — `store.visibleItems()` no eliminados a `.xlsx`.
  - **Importar Excel** — lee un `.xlsx`/`.xls`/`.csv` (columnas
    Nombre+Cantidad requeridas), matchea categoría por nombre, confirma, y
    llama `store.addNuevo(...)` por fila.
  - **Máquina del tiempo** — `admin.js#openTimeMachine()` (fix 2026-08-30:
    antes abría el panel de cuenta completo, `openPanel()`, con los
    respaldos mezclados adentro; ahora es su propio modal — ver más abajo).

## `views/egresorapido.js` — Egreso Rápido

Online-only: genera una comanda real (`create_comanda_rapida`), no un
ajuste de conteo. Bypasa la cola de sync por completo — el descuento de
stock ocurre en el servidor (trigger sobre `movement_items`), y como la RPC
no pasa por `sync.enqueue`, el módulo aplica un parche local manual sobre
`store.items` tras confirmar (para que la tarjeta en Insumos refleje el
nuevo stock sin esperar al próximo pull incremental).

- **Sin botón "X" propio en el encabezado** (fix 2026-08-28): Egreso Rápido
  es una pestaña al mismo nivel que Ingreso Rápido dentro del switcher
  compartido (`#qa-switcher`), no un panel anidado "dentro" de Ingreso;
  volver de Egreso a Ingreso es tocar la pestaña del switcher, no una X que
  "cerraba" Egreso (antes llamaba a `closeEgreso()`, que en realidad solo
  cambiaba de pestaña). Cerrar la hoja móvil entera es trabajo de
  `#qa-close-shell` — al principio se dejó ese botón solo en el encabezado
  de Ingreso, pero **desaparecía al alternar a Egreso** (`#qa-panel-ingreso`
  entero se oculta con `_setQaMode`, ver más abajo), así que se movió a
  `#qa-switcher` en `index.html` (fix 2026-08-29): vive afuera de los dos
  paneles, visible sin importar el modo activo, cableado directo en
  `app.js` (`boot()`) en vez de en el `_wire()` de cada panel.
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
- **Bloqueado para `super_admin` con "Todos los grupos"** (`_blocked()`,
  fix 2026-08-28): mismo criterio que Ingreso Rápido — sin un grupo puntual
  elegido no hay un stock concreto del que descontar. `resetEgresoRapido()`
  (exportada) repinta el panel y descarta el carrito a medias cuando cambia
  el filtro de grupo (`app.js#_onGrupoChange`), sin cerrar el panel ni
  avisar al switcher (a diferencia de `closeEgreso()`).

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
- **Etiqueta de grupo** (`_showGrupo()`, fix 2026-08-28): un `super_admin`
  viendo "Todos los grupos" (sin filtrar) ve, junto al nombre de cada
  insumo, un `.grupo-tag` con el grupo de extensión al que pertenece ese
  registro (`movements.grupo_id`) — necesario porque el catálogo es
  compartido: el mismo insumo puede tener movimientos de más de un grupo.

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
- **Etiqueta de grupo** (`_showGrupo()`, fix 2026-08-28): mismo criterio
  que Historial — con `super_admin` viendo "Todos los grupos", el top-3, las
  barras del detalle y la línea de tiempo agrupan/etiquetan por
  `(insumo, grupo)` en vez de solo por insumo, para no mezclar en un solo
  número lo recibido por grupos distintos del mismo producto compartido.
  `_cache` se refresca (`refreshIngresos()`) al cambiar el filtro de grupo
  si la pestaña está activa (`app.js#_onGrupoChange`) — antes quedaba
  desactualizado hasta el próximo ciclo de sync.

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

**Etiqueta de grupo**: mismo `_showGrupo()`/agrupación por `(insumo, grupo)`
y refresco al cambiar de filtro que `ingresos.js` — ver arriba.

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
- **Unidades por grupo de extensión** (revisión "productos multigrupo",
  2026-08-25): mismo formato de barra proporcional, `store.statsByGrupo()`
  — solo aparece cuando la vista mezcla más de un grupo (super_admin sin
  uno elegido en la barra superior).
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
- **`refreshComunicados()` no intenta nada sin sesión** (fix 2026-09-04):
  `comms` exige RLS `to authenticated`, así que sin `auth.isLoggedIn()` el
  fetch siempre fallaba (401/403) — `initComunicados()` corre en `boot()`
  antes de loguear (o justo después de borrar caché/storage y perder el
  token), y el polling de 25s lo repetía sin parar mientras el usuario
  seguía en el muro de login, mostrando "No se pudieron cargar los
  comunicados" aunque no hubiera ningún comunicado que cargar todavía.
  `checkAuth()` (`app.js`) llama a `refreshComunicados()` de nuevo en cada
  login para no esperar hasta 25s a que el badge/lista reflejen la cuenta
  nueva.

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
contraseña — un solo submit hace `create_person` (RPC) seguido de
`grant_login` (Edge Function; rol siempre `coordinador`, un admin nuevo se
crea directo contra la base). El campo Área (`#vol-area-field`) está
**oculto a propósito** (fix 2026-08-28): el `<select>` sigue en el DOM con
`'general'` como primera opción, así que se manda esa por defecto sin que
nadie la elija — ver `documentation/05-autenticacion.md#gestión-de-usuarios`
para el porqué (`canEditInventory()` ahora administra igual que cualquier
coordinador).

**Edición** (`#vol-edit-modal`, `window.editVolunteer(ci)`) — edita **toda**
la información de un usuario existente: nombre, apellido, **cédula**,
teléfono, correo, área y (opcional) contraseña. El campo Área
(`#vol-edit-area-field`) también está **oculto a propósito** (fix
2026-08-29) — `editVolunteer()` sigue precargando el `<select>` oculto con
el área ACTUAL de la persona (`v.area`) antes de abrir el modal, así que
editar el resto de los datos no se la cambia sin querer; solo deja de ser
reasignable desde acá mientras el selector esté oculto. Al guardar:

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
(rol no nulo). Un `super_admin` ve admin+coordinador de TODOS los grupos
(con el nombre del grupo); un admin normal solo ve coordinador de su propio
grupo, nunca a otros admins. Fila: nombre/correo/rol/área/teléfono/activo,
Activar/Desactivar (`set_active`, baneo nativo de Auth, reversible sin
reconfigurar nada), Revocar (`revoke_access`, limpia rol/área y cierra
sesión de inmediato — no borra la persona ni su cuenta, se puede volver a
otorgar acceso después).

**Editar** (`puedeEditar`, fix 2026-09-05) — visible para cualquier
coordinador, y para un `admin` de grupo **solo cuando quien mira es
super_admin** (el único que puede tocar una cuenta admin, ver `_guardTarget`
en `manage-users/index.ts`); nunca se ofrece para `super_admin`. Al guardar
sobre un admin, el submit se salta `update_area` (Edge Function) — la
rechaza siempre del lado del servidor porque un admin no tiene categoría
propia — pero sí corre `admin_update_person`, `update_email` y, si se
escribió una, `reset_password`.

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
  `store.viewingGrupoId`, y una acción — **"Editar"** (revisión "productos
  multigrupo", 2026-08-25 — reemplaza al viejo "Gestionar" + "Renombrar"):
  abre `openEditGrupoModal` (`views/admin.js`, compartido con la entrada
  "Editar mi grupo" del panel de cuenta de un admin normal) — nombre +
  categorías vinculadas (vincular una existente con buscador/crear una
  nueva, desvincular con opción de forzar el borrado lógico de los conteos
  vivos de esa categoría en el grupo).
- **Crear grupo** (`#grp-form`): un solo campo de nombre → `store.createGrupo`.
- **Stats**: solo grupos totales — la card "en gestión ahora" se quitó
  (2026-09-05): siempre coincidía con "Todos" o con exactamente una tarjeta
  de la lista de abajo (que ya la marca con el badge "En gestión ahora" y el
  estilo `.active`), así que era información duplicada sin aportar nada.
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
- **Panel** (`openPanel()`, botón de perfil, cualquier sesión):
  1. **"Mi perfil"** — nombre/apellido/teléfono propios, vía RPC
     `update_own_profile` (autoservicio, solo la fila del propio usuario).
     Cédula visible mostrada de solo lectura (no editable — solo un admin
     puede renombrarla, y solo la de otro usuario, desde Usuarios).
  2. **"Cambiar contraseña"** — autoservicio, `auth.updatePassword()`
     (Supabase Auth: la sesión ya es prueba de identidad, no pide la
     contraseña actual).
  3. **Exclusivo de `auth.isAdmin()` — "Mi grupo de extensión"** (fix
     2026-08-30: antes era cualquier `hasAdminRights()`, incluido
     super_admin): botón "Editar mi grupo" → `openEditGrupoModal` (mismo
     modal compartido con `views/grupos.js`, preescopado a `auth.grupo()`)
     — reemplaza a la vieja sección "Categorías de insumos" (revisión
     "productos multigrupo", 2026-08-25): la gestión de categorías (crear/
     vincular/desvincular) vive ahora ahí, no suelta en este panel. Un
     super_admin no "pertenece" a un único grupo (ve/administra todos, ya
     tiene su propia pestaña "Grupos" para eso), así que la opción no
     aplica.
  4. Cerrar sesión.

  Ya **no** incluye "Respaldos del conteo" (fix 2026-08-30) — se editaba la
  sesión propia mezclado con una herramienta de recuperación de datos sin
  relación. Ver `openTimeMachine()` más abajo.

- **`openTimeMachine()`** — modal aparte con **"Respaldos del conteo"**:
  lista de checkpoints (`checkpoints.js`) con crear/restaurar/borrar,
  confirmación danger para restaurar. Alcanzable solo desde el botón
  "Máquina del Tiempo" del pie de Ingreso Rápido (admin/super_admin, ver
  `ingresorapido.js#_wireAdminTools`) — ya no desde el panel de cuenta.

### `openEditGrupoModal(grupo, { onChange })` — exportado, compartido

Nombre del grupo (`update_grupo` — super_admin cualquiera, admin normal
solo el suyo) + lista de categorías vinculadas (`store.categoriesForGrupo`)
con "Renombrar" (global, afecta a todos los grupos que la usan) y
"Desvincular" (`delete_category` — si el servidor rechaza por conteos
vivos, ofrece un segundo `confirmDialog` para reintentar con `force: true`)
+ un buscador para vincular una categoría existente o crear una nueva
(`store.searchCategoryNames` + `store.createCategory`).

**"Zona de peligro" — Eliminar grupo** (2026-09-04, exclusivo de
`auth.isSuperAdmin()`, oculto por completo del modal para un admin normal
editando el suyo propio): botón que llama `store.deleteGrupo(id)` →
RPC `delete_grupo`. Mismo patrón de dos pasos que "Desvincular" categoría
arriba: primero sin forzar (el servidor bloquea si el grupo tiene
personas/categorías/insumos/movimientos/comandas/comunicados y devuelve el
detalle en el mensaje), y si bloquea, un segundo `confirmDialog` ofrece
reintentar con `force: true` (borra todo lo del grupo en cascada, incluidas
las cuentas de sus usuarios — quedan sin rol/área, `login()` las rechaza de
inmediato). No existía ninguna forma de borrar un grupo antes de esto.

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
