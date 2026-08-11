# 5. Autenticación y roles (`js/auth.js`, `js/views/admin.js`, RBAC)

> **Reescrito por completo el 2026-07-19** — unificación de acceso con
> UCVAcopio/UCVComandas (`00-plan-general.md`/`02-inventario.md`, carpeta
> hermana a los 3 repos). Todo lo que describía este documento antes de esa
> fecha (Supabase Auth por email+contraseña, `ADMIN_EMAILS` hardcoded en
> `js/config.js`, refresh automático de JWT) desapareció por completo — no
> es un ajuste incremental.

## Modelo de acceso

Login por **cédula + contraseña** contra la RPC `new_schema_archive.person_login`
(Postgres, `SECURITY DEFINER`, proyecto Supabase compartido con
UCVAcopio/UCVComandas) — no Supabase Auth, no JWT. La RPC valida el hash
bcrypt del lado del servidor y devuelve `{ci, role, area, name, surname}` o
cero filas (mismo error genérico si el CI no existe o si la contraseña no
coincide, para no filtrar qué cédulas existen).

**Inventario es la plataforma más restrictiva de las 3** (00-plan-general.md
§4): solo estas combinaciones de rol/área tienen acceso real —

| Rol + área | Acceso |
|---|---|
| `admin` | Completo + hub de gestión de usuarios (CRUD sobre cualquier no-admin) |
| `coordinador` con área que **no** sea `recepcion` ni `sala situacional` (desde 2026-07-26, una de las 13 categorías de insumos — `helpers.js#CATS`, todas, desde la reestructuración de categorías del mismo día — nunca texto libre, ver abajo) | Completo, pero **recortado a su propia área** en Conteo/Ingreso Rápido/Resumen (desde 2026-07-26, ver `store.js#visibleItems()` abajo); hub de usuarios también recortado a su propia área |
| `coordinador` con área `general` (nueva 2026-07-28, tercera área fija junto a `recepcion`/`sala situacional` — sin categoría de insumos propia, "solo sirve para crear usuarios adjuntos a ella") | **Solo consulta**: ve el catálogo/bitácora/resumen **completos, sin filtrar** (mismo alcance que admin en `store.visibleItems()`), pero no puede sumar/restar/crear/eliminar insumos ni borrar registros de bitácora (`auth.canEditInventory()` es `false` — sin Ingreso Rápido, sin los botones −/+/eliminar de Conteo, sin "Subir todo a la nube" de Resumen). Sí puede usar Egreso Rápido (con el catálogo completo) y despachar cualquier área en la pestaña Despachos (mismo alcance que admin del lado del servidor) |
| `coordinador` con área `recepcion` (=AcopioUCV) o `sala situacional` (=UCVComandas) | **Denegado por completo** |
| `voluntario` (cualquier área) | **Denegado por completo** — a diferencia de Acopio/Comandas, acá no hay una vista recortada de respaldo |

`js/auth.js` expone:

- `isLoggedIn()`, `ci()`, `role()`, `area()`, `name()`.
- `isAdmin()` / `isCoordinador()`.
- **`isGeneral()`** (nuevo 2026-07-28): `isCoordinador() && area() === 'general'`.
- **`canEditInventory()`** (nuevo 2026-07-28): `isAdmin() || (isCoordinador() && !isGeneral())`
  — el único chequeo que gatea cada acción que MODIFICA el inventario (ver
  las vistas listadas abajo); todo lo demás (consulta) sigue usando
  `hasPlatformAccess()`/`visibleItems()` sin distinguir General de un
  coordinador normal.
- **`hasPlatformAccess()`**: `admin`, o `coordinador` con área fuera de
  `{recepcion, sala situacional}` (`general` NO está en ese set denegado, así
  que sí entra). Es el único chequeo de **acceso a la plataforma** — no hay
  un tercer nivel "acceso parcial" como en las otras 2 apps; la restricción
  de General es de **qué puede hacer** una vez dentro (`canEditInventory()`),
  no de si entra.

## Visibilidad de insumos por área (`store.js#visibleItems()`, nuevo 2026-07-26)

Un `coordinador` solo ve el catálogo de **su propia área** (una de las 13
categorías); un `admin` ve el catálogo completo sin restricción. Igual que
el resto del control de acceso de las 3 apps, es 100% del lado del cliente
(`00-plan-general.md` §2) — `store.visibleItems()` filtra `store.items` por
`item.categoria === auth.area()` cuando `auth.isCoordinador() &&
!auth.isGeneral()`, y es lo que usan `stats()`/`statsByCat()`/`grouped()`/
`csv()` internamente (así que Conteo, Resumen y la exportación a Excel
heredan el filtro sin tocarlos uno por uno). `views/conteo.js` y
`views/ingresorapido.js` (buscador del panel de Ingreso Rápido, y el
`<select>` de categoría al crear un insumo nuevo, bloqueado al área propia
para un coordinador) llaman a `visibleItems()` en vez de `store.items`
directamente. El coordinador de área `general` (nuevo 2026-07-28) queda
excluido de este filtro a propósito — ve el catálogo completo, igual que
admin, ver la fila de la tabla de arriba.

También filtrados por área para un coordinador (mismo día, extensión del
cambio anterior) — el de `general` vuelve a quedar excluido, mismo criterio
que `visibleItems()`:

- **Bitácora** (`views/registro.js`): tanto el historial traído de la nube
  (`movement_items` con `products.type` como `categoria`) como el
  `store.activeLogs()` local se filtran por `l.categoria === auth.area()`
  justo antes de agrupar por día — un coordinador ya no ve movimientos de
  insumos de otras áreas en su bitácora (condición real:
  `auth.isCoordinador() && !auth.isGeneral()`).
- **Egreso Rápido** (`views/egresorapido.js`): el buscador de producto del
  carrito (`_searchProducto`) usa `store.visibleItems()` en vez de
  `store.items` — un coordinador solo puede armar una comanda con insumos de
  su propia área; el de `general` puede armarla con cualquier insumo de
  cualquier área, ya que `visibleItems()` no lo filtra.
  `_applyLocalStockPatch` (el parche optimista de stock tras confirmar la
  comanda) no necesitó cambio: solo toca ítems que ya pasaron por ese
  buscador.

Despachos (`views/despachos.js`) ya filtraba por área del lado del servidor
desde antes de este cambio (`list_despachos_pendientes`, ver
[04-vistas-ui.md](./04-vistas-ui.md)) — no necesitó tocarse para lo de
2026-07-26; sí se tocó el 2026-07-28 para darle a `general` el mismo alcance
que a `admin` (ver abajo).

## Qué NO puede hacer el coordinador de "General" (`auth.canEditInventory()`, nuevo 2026-07-28)

A diferencia del resto del RBAC de esta app (acceso a la plataforma
completa o nada, ver tabla de arriba), General es el primer caso de "acceso
parcial" dentro del app-shell: entra, ve todo, pero no puede tocar el
inventario de ninguna área. `auth.canEditInventory()` (`admin`, o
`coordinador` que no sea `general`) gatea cada punto de escritura sobre
insumos/conteo:

- **`views/conteo.js`**: sin `auth.canEditInventory()`, `_itemHTML()` pinta
  la fila sin el botón ⋮ ni el panel −/cantidad/+/eliminar — solo
  nombre/stock/check, de solo lectura. `_patchItem()` tolera la ausencia de
  `.cnt-qty` en esas filas (repintado en vivo tras un pull).
- **`app.js#applyRBAC()`**: Ingreso y Egreso Rápido comparten un mismo panel
  (`#ingresorapido`, alternado por `.qa-switcher` — ver
  [04-vistas-ui.md](./04-vistas-ui.md)); para General se oculta solo la
  pestaña "Ingreso Rápido" del switcher (`#qa-switch-ingreso`) y se fuerza el
  modo a `'egreso'` (`_setQaMode('egreso')`) — a diferencia de Conteo, acá no
  tiene sentido dejar Ingreso "de solo lectura", así que se esconde entero.
  Egreso Rápido NO se oculta: genera una comanda real de salida, no es
  "editar mi propio inventario", y General puede despachar cualquier área.
- **`views/registro.js`**: el botón de borrar/corregir un registro
  (`.reg-del`, revierte el delta sobre el insumo) solo se pinta con
  `auth.canEditInventory()`.
- **`views/resumen.js`**: el botón "Subir todo a la nube" (`sync.pushAll`)
  solo se pinta con `auth.canEditInventory()`.
- **`views/despachos.js`**: caso inverso — General SÍ puede despachar
  cualquier área (no es "modificar inventario propio", es la acción que el
  área existe para habilitar). El subtítulo muestra "Todas las áreas" igual
  que admin, y las RPC `list_despachos_pendientes`/`marcar_despacho_entregado`
  (`supabase-migrations/20-area-general-y-edicion-usuarios-2026-07-28.sql`)
  tratan `v_area = 'general'` igual que `v_role = 'admin'` del lado del
  servidor.

Todo esto sigue el mismo criterio de "control de acceso 100% del lado del
cliente" del resto de las 3 apps — **excepto** Despachos, donde el alcance
real (qué área puede ver/despachar) siempre vivió del lado del servidor y
ahí es donde se tocó para General.

`app.js#checkAuth()` fuerza un repintado de la página activa (Conteo o
Resumen) en cada cambio de sesión (`auth.onChange`), no solo al cambiar de
pestaña — antes de esto, tras un login la lista de insumos se quedaba con
lo último renderizado (p. ej. sin filtrar, de antes de loguear) hasta que el
usuario navegaba manualmente a otra pestaña y volvía.

## `login(ci, password)`

1. `POST /rest/v1/rpc/person_login` con `{p_ci, p_password}`, header
   `Content-Profile: new_schema_archive`, siempre con la anon key.
2. 0 filas → "Cédula o contraseña incorrecta."
3. Si el rol es `voluntario`, o es `coordinador` con área en
   `{recepcion, sala situacional}` → "No tienes acceso a esta plataforma."
   (mensaje distinto a propósito, confirma que la cuenta existe sin filtrar
   más que eso — mismo criterio que las otras 2 apps). **No** guarda
   sesión en ningún caso de rechazo.
4. Si pasa, guarda `{ci, role, area, name, surname}` en
   `localStorage['ucv-inv-session']` (mismo storage key que el sistema
   viejo, shape nuevo) y emite el cambio a los suscriptores de `onChange`.

Sin token, sin `expires_at`, sin refresh — no hay nada que renovar. El
mecanismo de expiración/renovación de sesión que describía este archivo
antes del 2026-07-19 se eliminó entero.

## `checkAuth()` (`js/app.js`)

Muro de login (`#login-wall`) para **cualquiera** sin `hasPlatformAccess()`
— a diferencia de Acopio/Comandas, Inventario nunca deja pasar a un
`voluntario` a una vista recortada; el único estado "dentro" de la app es
tener acceso completo. Defensivo: si hay una sesión guardada en
`localStorage` cuyo rol/área ya no tiene acceso (ej. un coordinador
reasignado de área después de loguear), se cierra sesión automáticamente
antes de mostrar el shell.

**Cada inicio de sesión arranca en Conteo (nuevo 2026-07-27)**: `_wasLoggedIn`
(variable de módulo en `app.js`, distinta de `_contadorSyncCi`) detecta la
transición real login-wall → app-shell — cuando ocurre, se llama `nav('conteo')`
sin importar en qué pestaña haya quedado la sesión anterior. Antes de este
cambio, cerrar sesión y entrar con otra cuenta en el mismo dispositivo dejaba
la pestaña (y el contenido ya renderizado — p.ej. el hub de Usuarios o el
Resumen de la cuenta anterior) tal como había quedado, hasta que alguien
navegaba manualmente. El modal de reautenticación (confirmar contraseña antes
de borrar un conteo, `views/conteo.js`) llama a `auth.login()` de nuevo sin
pasar por `signOut()` primero, así que nunca dispara esta transición ni
interrumpe al usuario a mitad de esa acción.

## `applyRBAC()` (`js/app.js`)

**Simplificado 2026-07-19**: como solo `hasPlatformAccess()` llega al
app-shell, ya no hace falta ocultar ninguna de las 5 pestañas por rol (4
originales + "Despachos", nueva 2026-07-24) —
todas quedan visibles para cualquiera que esté dentro. Lo que sí varía por
rol es el **contenido** de la pestaña Usuarios (ver
[04-vistas-ui.md](./04-vistas-ui.md#viewsvoluntariosjs--hub-de-gestión-de-usuarios)),
no su visibilidad.

## `js/views/admin.js` — botón de perfil + panel

- **`renderLoginWall(container)`**: formulario con cédula (`#adm-ci`,
  numérico) + contraseña — antes email + contraseña.
- **`openPanel()`**: un solo panel para admin y coordinador (ambos son los
  únicos que llegan aquí) — nombre, rol/área, respaldos (crear/restaurar/
  borrar checkpoints, **solo admin desde 2026-07-27** — antes cualquier
  coordinador también podía crear/restaurar/borrar un respaldo del conteo
  completo, no solo del suyo, ya que los checkpoints son globales al
  catálogo entero; la sección entera y `_paintCpList()` ahora se condicionan
  a `auth.isAdmin()`) y cerrar sesión. Ya no hay una versión "básica" del
  panel para un rol sin acceso completo, porque ese rol nunca llega a
  loguear.
- **"Mi perfil" (nuevo 2026-07-26, migrado a RPC 2026-07-28)**: sección del
  mismo panel donde cualquier sesión (admin o coordinador) edita su
  **nombre**, **apellido** y **teléfono** — la cédula se muestra de solo
  lectura, nunca editable (es la clave primaria de `persons`/
  `person_credentials`, cambiarla equivaldría a crear otra cuenta). Hasta el
  2026-07-27 escribía (y leía la precarga del teléfono) directo contra
  `persons`/`phones` vía REST, bajo el supuesto de que esas 2 tablas tenían
  RLS deshabilitada igual que `products` — supuesto que resultó **falso**:
  RLS está activa en todas las tablas de este esquema, sin excepción, así
  que ese PATCH/POST/GET directo con la sola anon key no garantizaba
  funcionar. Reemplazado por 2 RPC `SECURITY DEFINER` de autoservicio
  (`supabase-migrations/21-fix-mi-perfil-rpc-2026-07-28.sql`):
  - **`get_own_phone(p_actor_ci)`**: precarga `#adm-prof-cod`/
    `#adm-prof-telf` (nombre/apellido siguen precargándose desde
    `auth.session`, sin ida al servidor, sin cambios ahí).
  - **`update_own_profile(p_actor_ci, p_name, p_surname,
    p_phone_company_code, p_phone_number)`**: guarda los 3 campos —
    busca-o-crea el teléfono en `phones` y apunta `persons.phone_id`, mismo
    patrón interno que `create_user`, pero solo puede tocar la fila del
    propio `p_actor_ci` (nunca la de otro usuario, a diferencia de
    `admin_update_user_profile` de `20-area-general-y-edicion-usuarios-
    2026-07-28.sql`, que es la versión "editar a OTRO" usada desde el hub de
    Usuarios).
  Al guardar, sigue llamando a `auth.updateProfile({name, surname})` para
  refrescar la sesión en memoria/`localStorage` sin forzar un re-login —
  eso no cambió.
- **"Cambiar contraseña" (nuevo 2026-07-26)**: formulario aparte en el
  mismo panel, vía la RPC `update_own_password(p_actor_ci,
  p_current_password, p_new_password)` — a diferencia de nombre/apellido/
  teléfono, esto sí pasa por RPC porque `person_credentials` mantiene RLS
  activa (único punto de escritura). La RPC exige la contraseña **actual**
  antes de aceptar la nueva: sin ese chequeo, conocer la cédula de alguien
  (dato nada secreto) bastaría para secuestrarle la cuenta.
- **`requireCoord()`**: se mantiene el nombre por compatibilidad, ahora es
  `auth.isLoggedIn()` — chequeo defensivo, en la práctica siempre `true` en
  el único lugar donde se usa (`resumen.js`, "Subir todo a la nube") porque
  `checkAuth()` ya filtró todo lo demás antes.

## Cómo el resto del sistema usa esto

- `js/sync.js` — headers siempre con la anon key (`Accept-Profile`/
  `Content-Profile: new_schema_archive`), nunca un token de sesión — no
  existe. Ver [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md).
- `js/views/quickadd.js` — el nombre del "contador" se deriva de
  `auth.name()` si no se fijó manualmente (antes, del username del email de
  sesión).
- `js/views/registro.js` — ya no condiciona la fuente de datos (nube vs.
  local) a si hay sesión: con o sin sesión, la anon key alcanza para leer
  la bitácora (ver [04-vistas-ui.md](./04-vistas-ui.md)).
- `js/views/voluntarios.js` — hub de gestión de usuarios de **todo el
  sistema** (no solo Inventario), reescrito por completo — ver
  [04-vistas-ui.md](./04-vistas-ui.md).

## RPCs de Postgres detrás de este sistema (`new_schema_archive`)

Versionadas en `supabase-migrations/` (carpeta hermana a los 3 repos, no en
`supabase/*.sql` de este repo):

- `person_login(p_ci, p_password)` — el login.
- `create_user`/`update_user_role`/`delete_user(p_actor_ci, ...)` — gestión
  de usuarios. `create_user` exige también `p_phone_company_code`/
  `p_phone_number` (`persons.phone_id` es `NOT NULL` en el esquema real —
  hallazgo al implementar, no estaba en el sub-plan original). Desde
  2026-07-26 (`supabase-migrations/13-restringir-area-categoria-*.sql`),
  cuando el actor es `admin` ambas RPC además validan `p_area` del lado del
  servidor: tiene que ser `recepcion`, `sala situacional`, o una de las
  categorías de `new_schema_archive.product_type` — desde la reestructuración
  de categorías del 2026-07-26 el enum ya no tiene un valor `otros` que
  excluir a mano, así que la validación se simplificó — ya no
  alcanza con que el cliente solo ofrezca esas opciones en el `<select>`,
  porque `person_credentials` es la única tabla de este sistema que no se
  puede tocar sin pasar por una RPC.
- `update_own_password(p_actor_ci, p_current_password, p_new_password)`
  (nuevo 2026-07-26, `14-rpc-update-own-password-*.sql`) — autoservicio de
  cambio de contraseña desde "Mi perfil" (ver arriba); verifica
  `p_current_password` contra el hash guardado antes de aceptar el nuevo.
- `list_users(p_actor_ci)` — no estaba en el plan original: `anon` no
  tiene `SELECT` sobre `person_credentials` (el hash de password no debe
  exponerse vía REST directo), así que listar usuarios necesitó una RPC
  `SECURITY DEFINER` dedicada. Devuelve también `phone_company_code`/
  `phone_number` desde 2026-07-26→2026-07-28 (`20-area-general-y-edicion-
  usuarios-*.sql`, `DROP FUNCTION` + recreate porque cambia `RETURNS TABLE`)
  para precargar el modal de edición extendido de `voluntarios.js`.
- `admin_update_user_profile(p_actor_ci, p_target_ci, p_name, p_surname,
  p_phone_company_code, p_phone_number)` (nuevo 2026-07-28) — nombre/
  apellido/teléfono de **otro** usuario, mismo criterio de alcance que
  `update_user_role`. RLS está activa en `persons`/`phones` (todas las
  tablas de este esquema la tienen, no solo `person_credentials`), así que
  esto pasa por RPC igual que el resto — a diferencia de lo que asumía
  `js/views/admin.js` ("Mi perfil", ver más abajo) sobre esas 2 tablas en
  particular.
- `admin_reset_password(p_actor_ci, p_target_ci, p_new_password)` (nuevo
  2026-07-28) — contraseña de **otro** usuario sin pedir la actual (a
  diferencia de `update_own_password`, autoservicio): el actor ya
  demostró ser admin/coordinador con permiso sobre ese target, eso basta.
- `apply_count`/`uncount_item`/`delete_count` — el motor de conteo (ver
  [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md)), no son
  RPCs de autenticación pero viven en el mismo lote de migraciones del
  corte de proyecto.

Todas comparten el mismo criterio de alcance: `admin` opera sobre cualquier
no-admin; `coordinador` solo sobre voluntarios de su propia `area`;
`voluntario` no gestiona usuarios (y, en esta app en particular, ni
siquiera puede loguear).

## Puntos ya resueltos que este documento marcaba como pendientes

Las preguntas que dejaba abiertas la versión anterior de este archivo
("¿el RLS restringe algo a nivel de fila, o todo es solo UI?", "¿contar es
realmente libre sin login?") quedaron resueltas por el propio rediseño: el
control de acceso de las 3 apps es **deliberadamente** 100% del lado del
cliente (decisión de arquitectura documentada en `00-plan-general.md` §2,
no un descuido) — y en Inventario específicamente, ya no hay "contar sin
login": todo el `app-shell`, incluido Conteo, exige `hasPlatformAccess()`.
