# 4. Vistas / UI (`js/views/*.js`, `js/components/toast.js`)

Cada vista es un módulo con una función `render*(rootEl)` que reemplaza el
`innerHTML` del contenedor y conecta sus propios listeners (no hay un
framework de componentes ni virtual DOM — todo es DOM imperativo con
template strings).

## `views/conteo.js` — Conteo físico (vista principal)

Lista completa del catálogo, agrupada por categoría, con filtros y
actualización incremental para no perder el scroll al sincronizar.

- **Tarjeta de progreso** (`renderTop`): porcentaje de insumos contados +
  unidades totales, recalculada desde `store.stats()`.
- **Controles**: buscador con debounce de 150ms (`normSearch`), y 3 filtros
  (`todos` / `pendientes` / `contados`).
- **Lista agrupada por categoría** (`renderList`), orden fijo definido en
  `CAT_ORDER`. Cada categoría es una sección colapsable; se abre la primera
  automáticamente en el primer render. Si hay búsqueda o filtro activo,
  todas las secciones se fuerzan abiertas (`forceOpen`).
- **Fila de insumo** (`_rowHTML`): checkbox visual de "contado", nombre +
  unidad, input numérico con botones `−`/`+`, botón `×` para desmarcar
  (`store.resetItem`). El guardado del input tiene debounce de 550ms
  (`_onInput`) y también se dispara con Enter (que además mueve el foco al
  siguiente input, permitiendo contar en cadena sin usar el mouse) o al usar
  los botones de paso.
- **`syncView()`** — se llama cuando `sync.js` termina un ciclo de pull. En
  vez de re-renderizar toda la lista (lo que perdería el scroll y las
  categorías abiertas), repinta en sitio los datos de las filas ya visibles
  — salvo la fila que el usuario esté editando en ese momento
  (`document.activeElement`). Solo dispara un `renderList()` completo si
  cambió la cantidad total de ítems (alta remota de un insumo nuevo).
- **`refreshItem(id)`** — refresco puntual de una fila concreta, usado por
  `app.js` cuando el panel de agregado rápido (`quickadd.js`) modifica un
  ítem mientras la vista de conteo está activa.

## `views/quickadd.js` — Agregado rápido

Panel persistente e independiente de la vista activa (vive en
`<aside id="quickadd">`, montado una sola vez desde `app.js`). En desktop es
una barra lateral fija; en móvil se convierte en una hoja inferior
(`openSheet`/`closeSheet`, clase `.open` + backdrop).

Tres estados internos (variables de módulo `_sel`, `_new`):

1. **Buscador** (estado por defecto): input con sugerencias en vivo
   (debounce 110ms), scored por si el texto normalizado empieza con la
   query o solo la contiene, top 8 resultados. Última opción de la lista
   siempre es "Crear `<query>`".
2. **Insumo seleccionado** (`_sel`): tarjeta con el total actual, input de
   cantidad, y botones **Sumar**/**Restar** (Enter = sumar, Shift+Enter =
   restar). Cada operación llama a `store.registrar(id, ±n)`, muestra un
   toast con el resultado, y refresca el total en pantalla sin cerrar el
   panel (para poder sumar varias veces seguidas).
3. **Crear insumo nuevo** (`_new`): nombre + categoría + unidad + cantidad
   inicial → `store.addNuevo(...)`.

El pie del panel muestra el nombre del "contador" activo — si el usuario no
lo fijó manualmente (`store.setContador`), se deriva del nombre de la cuenta
con sesión (`auth.name()` — **actualizado 2026-07-19**, antes
`auth.email().split('@')[0]`; ya no hay email, el login es por CI, ver
`05-autenticacion.md`), con una etiqueta visual "cuenta" para distinguir el
origen.

Tras cualquier acción, se invoca el callback `onAdded(id, isNew)` (pasado
desde `app.js`), que decide si repintar la lista completa (alta nueva) o
solo la fila afectada, y cierra la hoja en móvil para volver a ver la lista.

## `views/registro.js` — Bitácora

Vista accesible a quien tenga acceso completo a la plataforma
(`auth.hasFullAccess()` — admin o coordinador con área fuera de
recepción/sala situacional, ver `05-autenticacion.md`; un `voluntario` nunca
llega a loguear en esta app en absoluto). **Actualizado 2026-07-19**: ya no
depende de "sesión activa" para decidir la fuente de datos — sin JWT, la
anon key alcanza para leer la bitácora igual que para contar; antes de este
cambio la condición era `if (SUPABASE_URL && auth.token())`, ahora es solo
`if (SUPABASE_URL)`.

Muestra el historial de conteos agrupado por día. **Trae el historial
completo directamente desde Supabase** (`GET /rest/v1/movement_items` con
`select` anidado a `movements` y `products`, `limit=500`, orden descendente
por `id`, header `Accept-Profile: new_schema_archive`), reconstruyendo cada
fila a partir de `movement.direction` (`in`/`out`) para inferir el signo
del delta. Si esa llamada falla o no hay red, usa `store.activeLogs()`
(datos locales).

- Agrupación por día vía `localDate()`, con badge "Hoy" en el día actual y
  suma de unidades positivas por día en el encabezado.
- Cada fila (`_rowHTML`) muestra hora, punto de color por categoría, nombre,
  quién contó, delta (con signo), y un botón de borrar/corregir que llama a
  `store.deleteLog(id, fallback)` — el `fallback` reconstruye los datos
  mínimos del log a partir de los `data-*` del botón, por si el registro no
  existe en `store.logs` local (por ejemplo, si vino de la consulta directa
  a la nube y no del store local).

## `views/resumen.js` — Progreso + exportación

- **Hero**: anillo SVG de progreso (`stroke-dasharray` calculado a partir
  del porcentaje) + contadores de contados/pendientes/unidades.
- **Acciones**:
  - *Exportar a Excel* / *Solo pendientes* (`_export`): usa la librería
    global `XLSX` (cargada por CDN en `index.html`) para generar un `.xlsx`
    con columnas `ID, Insumo, Categoría, Unidad, Cantidad, Contado, Contado
    por`, ordenado por categoría (según `CAT_ORDER`) y luego alfabéticamente.
    Nombre de archivo con fecha ISO (`inventario-real-[pendientes-]YYYY-MM-DD.xlsx`).
  - *Subir todo a la nube* (solo visible si `sync.enabled`): acción sensible
    protegida por `requireCoord()` (ver
    [05-autenticacion.md](./05-autenticacion.md)); llama a
    `sync.pushAll(store.items)`, que encola cada ítem como upsert de
    `products`.
- **Desglose por categoría**: barra de progreso individual por categoría
  usando `store.statsByCat()`.

## `views/voluntarios.js` — Hub de gestión de usuarios

> **Reescrito por completo el 2026-07-19** (02-inventario.md §3, carpeta
> hermana a los 3 repos) — el modelo viejo (Supabase Auth con email
> sintético `${ci}@ucv.ve`, columnas `status`/`turno`/`departamento` sobre
> `persons` que probablemente nunca llegaron a aplicarse contra
> `new_schema_archive`) queda completamente reemplazado. Ya no es solo el
> alta de voluntarios de esta app — es el hub de administración de
> **cuentas de sistema de las 3 apps** (Acopio/Comandas/Inventario
> comparten el mismo `person_credentials`).

No pasa por `sync.js`/`db.js`/`store.js`: hace `fetch` directo contra las
RPC `create_user`/`list_users`/`delete_user`/`update_user_role`/
`admin_update_user_profile`/`admin_reset_password` de `new_schema_archive`
(`Content-Profile` header, anon key — sin JWT, ver `05-autenticacion.md`),
fuera del patrón offline-first del resto de la app (si no hay red, la
operación simplemente falla, no se encola).

Dos vistas según el rol de la sesión (`auth.isAdmin()`):

- **Admin**: título "Gestión de Usuarios". El formulario de alta incluye
  selector de **rol** (`voluntario`/`coordinador`) y de **área**: un único
  `<select>` con `recepcion`/`sala situacional`/`general` (nuevo
  2026-07-28, ver abajo) + un `<optgroup>` con las 13 categorías de insumos
  (`helpers.js#CATS`, todas — desde la reestructuración de categorías del
  2026-07-26 ya no existe una categoría catch-all tipo "otros" que excluir
  aquí) — ya **no** es texto libre (desde 2026-07-19, ver
  [05-autenticacion.md](./05-autenticacion.md)). El listado (`list_users`)
  muestra **todos** los no-admin del sistema (coordinadores de cualquier
  área + voluntarios), con botones Editar y Eliminar por fila.
  Al editar, si el área guardada ya no calza con ninguna opción válida
  (un valor viejo de antes de esta restricción), `_areaOptionsHTML()`
  agrega una opción temporal con ese valor para no reasignarlo en
  silencio si el admin guarda sin tocar el selector.
  - **Editar (extendido 2026-07-28)**: además de rol/área, el modal ahora
    también edita **nombre**, **apellido**, **teléfono** y, opcionalmente,
    **contraseña** (campo vacío = no se toca) de cualquier usuario — antes
    solo tocaba rol/área. `editVolunteer(ci)` ya no recibe los campos por
    parámetro del `onclick` inline: busca el registro completo (incluido
    `phone_company_code`/`phone_number`, nuevas columnas de `list_users`)
    en `_lastUsers`, el resultado cacheado de la última carga, para
    precargar el formulario. Al guardar se llaman 3 RPC en secuencia —
    `update_user_role` (rol/área), `admin_update_user_profile`
    (nombre/apellido/teléfono) y, si se escribió algo,
    `admin_reset_password` (contraseña) — cada una es su propio punto de
    escritura en el servidor (`person_credentials` vs. `persons`/`phones`),
    no una transacción atómica única; un fallo a mitad de camino dejar
    parte ya guardada es un caso aceptado, no manejado con rollback.
    `admin_reset_password` es distinto de `update_own_password`
    (`05-autenticacion.md`, "Mi perfil"): ese es autoservicio y exige la
    contraseña actual; este lo usa un admin/coordinador sobre la cuenta de
    **otra** persona y no pide nada más que el permiso ya validado sobre
    ese target.
- **Coordinador**: título "Mis Voluntarios". Sin selector de rol/área en el
  alta — el formulario solo pide cédula/nombre/apellido/teléfono/contraseña,
  y el backend fuerza `role=voluntario` + el área del propio coordinador
  (ignora cualquier área que se le mande). El listado (`list_users`, ya
  recortado del lado del servidor) solo trae voluntarios de su misma área.
  Sin botón Editar (nada que editar: rol/área quedan siempre fijos para lo
  que un coordinador puede crear) — solo Eliminar.

Ambos roles llaman siempre con `p_actor_ci: auth.ci()` — las RPC son las
que deciden qué se puede hacer, replicando del lado del servidor las reglas
de `00-plan-general.md` §4.3 ("un coordinador nunca crea coordinadores",
etc.), no solo ocultando controles en el cliente.

**Hallazgo real al implementar, no anticipado por el sub-plan original**:
`persons.phone_id` es `NOT NULL` en el esquema real — `create_user` exige
también `p_phone_company_code`/`p_phone_number` (por eso el formulario de
alta sigue pidiendo teléfono, con el mismo selector de código de operadora
+ 7 dígitos que ya tenía la versión vieja). Otro hallazgo: `anon` no tiene
`SELECT` directo sobre `person_credentials` (correcto por seguridad, el
hash de password no debe exponerse vía REST) — por eso hizo falta la RPC
`list_users` nueva, que el plan original tampoco incluía.

**Área "General" (nuevo 2026-07-28)**: tercera área fija junto a
`recepcion`/`sala situacional` (ver `supabase-migrations/
20-area-general-y-edicion-usuarios-2026-07-28.sql`, carpeta hermana a los 3
repos) para coordinadores sin categoría de insumos propia — a diferencia de
esas otras 2, **no** está en `DENIED_COORD_AREAS` (`auth.js`), así que sí
entra a Inventario. Su restricción no es de acceso a la plataforma sino de
qué puede hacer dentro de ella: consulta el catálogo/bitácora/resumen
completos (`store.visibleItems()` deja de filtrar por área cuando
`auth.isGeneral()`, igual que para admin) pero nunca los modifica
(`auth.canEditInventory()` — sin Ingreso Rápido, sin los botones −/+/eliminar
de Conteo, sin borrar registros de Bitácora, sin "Subir todo a la nube" de
Resumen) y puede despachar cualquier área en la pestaña Despachos
(`list_despachos_pendientes`/`marcar_despacho_entregado` le dan el mismo
alcance que a `admin` del lado del servidor). Ver
[05-autenticacion.md](./05-autenticacion.md) para el detalle de RBAC.

Nota de implementación heredada: sigue usando `window.editVolunteer`/
`window.deleteVolunteer` como funciones globales para poder invocarlas
desde atributos `onclick` inline generados en el template string.

## `views/despachos.js` — Despachos por área (nuevo 2026-07-24)

Pestaña ajena al resto de la app: no pasa por `store.js`/`db.js`/`sync.js` (no
es parte del motor de conteo offline-first), es de escritura directa contra
Supabase apenas hay conexión — mismo patrón que `voluntarios.js` (su propio
`_headers()`/`_rpc()` duplicado, sin abstraer un helper compartido, mismo
criterio del resto del proyecto de preferir la pequeña duplicación a una
abstracción prematura entre 2 archivos).

Cada ítem de una comanda de UCVComandas (origen `manual`/`personal` — Entrega
Rápida nunca genera despachos, se entrega en mano en el momento de la carga)
es un despacho pendiente hasta que el coordinador cuya `area`
(`person_credentials.area`) coincide con la categoría del producto
(`products.type`) lo confirma. UCVInventario **nunca llama al backend de
UCVComandas** — ambos sistemas solo comparten la base Postgres — así que esta
vista pega directo contra 2 RPC `SECURITY DEFINER` nuevas (`new_schema_archive`,
ver `supabase-migrations/12-rpc-despachos-2026-07-24.sql` en la carpeta
hermana a los 3 repos, y la sección "Flujo de despachos por área" en
`UCVComandas/documentation/01-arquitectura.md`):

- **`list_despachos_pendientes(p_actor_ci)`**: admin ve los despachos de
  cualquier área; coordinador solo los de la suya, salvo el de área
  `general` (nuevo 2026-07-28), que también ve todas — el filtro lo resuelve
  la propia RPC del lado del servidor, la vista no vuelve a filtrar en
  cliente.
  Devuelve, por cada ítem pendiente, el nombre del producto, la cantidad,
  la unidad, la categoría, el nombre del solicitante (o "Sin solicitante" si
  la comanda no tiene uno asignado) y `solicitado_en` (`created_at` de la
  comanda — la hora en que se generó la solicitud, no la del despacho).
- **`marcar_despacho_entregado(p_actor_ci, p_item_id)`**: botón "Entregar" por
  fila. La RPC valida de nuevo el área (no confía solo en que la UI ya
  filtró) y, si era el último ítem pendiente de esa comanda, la avanza sola a
  `despachada` del lado del servidor — la vista no necesita saber nada de eso,
  solo recarga la lista tras el `POST` exitoso.

`renderDespachos(hostEl)` arma el shell una sola vez (`loaded`, mismo patrón
que `voluntarios.js`) con un botón "Actualizar" manual y un subtítulo que
muestra el área activa (`auth.area()`) o "Todas las áreas" para admin **y
para el coordinador de "General"** (`auth.isGeneral()`, nuevo 2026-07-28 —
ver `04-vistas-ui.md#views/voluntarios.js` y `05-autenticacion.md`): ambos
tienen el mismo alcance de "todas las áreas" del lado del servidor, el
cliente solo refleja ese rótulo. Fila vacía: "No hay despachos pendientes
por ahora". Errores de la RPC (incluidos los de permiso) se muestran inline
en la lista o vía `toast.err`, según si ocurren al cargar o al confirmar.

### Notificación de despachos nuevos + badge (nuevo 2026-07-24)

A diferencia del resto de la app, esto **no depende de que la pestaña esté
abierta**: `initDespachosWatcher()` (llamado una sola vez desde `boot()` en
`app.js`, justo después de `auth.init()`) arranca un sondeo de fondo — mismo
espíritu que el timer de red de seguridad de `sync.js` (30s), acá cada 25s,
sin relación real entre esos dos números — que llama a
`list_despachos_pendientes` sin importar qué página esté activa. Dos efectos
visibles:

- **Badge numérico** en el botón "Despachos" de ambas barras de navegación
  (`#dsp-badge-desktop` en `.tn-nav`, `#dsp-badge-mobile` superpuesto en la
  esquina del ícono de `.m-bottomnav`) — total de despachos pendientes en
  este momento, no un contador de "no leídos". Estilado 100% inline en
  `index.html` (mismo criterio que `voluntarios.js`, sin agregar clases
  nuevas a `styles.css`), oculto por defecto (`display:none`) hasta el
  primer sondeo.
- **Toast** (`toast.info`) cuando aparece al menos un ítem nuevo desde el
  último sondeo — un solo toast con la cantidad ("N despachos nuevos
  pendientes"), nunca uno por ítem, aunque hayan llegado varios a la vez en
  la misma corrida (se comparan sets de `item_id` entre corridas,
  `_seenIds` en el módulo).

La primera lectura tras un login (`_seenIds === null`) **no dispara toast**
— solo establece la línea base en silencio, para no bombardear con el
backlog completo de despachos pendientes cada vez que alguien abre sesión;
el badge sí se pinta de una con el total real desde ese primer sondeo.
`auth.onChange(_backgroundCheck)` fuerza un sondeo inmediato en cada
login/logout y resetea `_seenIds`/oculta el badge si la sesión pierde acceso
a la plataforma — evita que la cuenta de un coordinador se filtre a la
sesión de otro en un dispositivo compartido. Fallos de red del sondeo de
fondo son silenciosos (sin `toast.err`, a diferencia de `loadDespachos()`)
para no generar ruido cada 25s ante un corte puntual.

## `components/toast.js` — notificaciones

Componente mínimo: un contenedor `.toast-wrap` creado on-demand y anexado a
`document.body`. Tres helpers (`toast.ok`, `toast.err`, `toast.info`) que
crean un `<div>` con clase de color, lo animan con una clase `.in` (via
`requestAnimationFrame` para permitir la transición CSS) y lo remueven tras
2.6s.
