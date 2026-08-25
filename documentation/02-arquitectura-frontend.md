# 2. Arquitectura frontend

## `index.html` — shell de la app

Un único documento HTML que actúa de *app shell*.

- `#login-wall` — contenedor vacío; `admin.js#renderLoginWall` inyecta el
  formulario cuando no hay sesión.
- `#app-shell` — todo lo demás, oculto (`display:none`) hasta que hay
  sesión.
  - `<header class="topnav">` (desktop) y `<div class="m-topbar">` (móvil):
    marca (`#brand-bold`/`#brand-rest`, sobrescritos en el arranque desde
    `branding.js`), badge de versión (`.version-badge`, ver
    [07-pwa-offline.md](./07-pwa-offline.md)), navegación entre pestañas,
    selector de grupo de extensión (`#grupo-switch`/`#grupo-switch-m`,
    exclusivo de `super_admin`), pill de estado de sincronización
    (`#sync-pill`/`#sync-pill-m`) y botón de perfil (`#auth-btn`). En móvil
    (`.m-topbar-right`), el logo (`.m-brand`) nunca cede espacio — es el
    grupo de la derecha el que se acorta si no entra todo: el selector de
    grupo baja de 150px a 64px de ancho y la pill de sync pierde el texto
    (solo queda el punto de color; el detalle sigue en el `title` del
    elemento) — antes, con ambos a pleno ancho en una cuenta super_admin,
    el logo terminaba parcialmente tapado.
  - `<div class="statusbar">` (solo desktop): reloj en vivo + título de la
    página activa.
  - `<div class="app">`:
    - `<aside class="quickadd" id="ingresorapido">` — un solo panel
      compartido por Ingreso y Egreso Rápido, alternado por
      `.qa-switcher` (ver más abajo). Contiene `#qa-panel-ingreso` y
      `#qa-panel-egreso` (uno visible a la vez) y un pie compartido
      `#qa-shell-foot`.
    - `<main class="main">` — un `<div id="page-X">` por pestaña
      (`conteo`, `registro`, `ingresos`, `egresos`, `resumen`, `despachos`,
      `comunicados`, `voluntarios`, `grupos`), todos montados en el DOM a
      la vez; `app.js#nav()` alterna su `display` para navegar (no hay
      router de URL/history — no hay deep-linking entre pestañas por URL).
      Dos pares comparten una sola pestaña en la bottom nav móvil pero
      siguen siendo `#page-X` separados: Ingresos/Egresos bajo
      `[data-page="movimientos"]` (`#m-subnav-mov`) y Usuarios/Grupos bajo
      `[data-page="accesos"]` (`#m-subnav-acc`) — ver `_syncMovSubnav`/
      `_syncAccSubnav` más abajo.
  - FAB (`#fab-qa`) + backdrop + bottom nav — solo móvil (≤820px), abren/
    cierran el panel de Ingreso/Egreso Rápido como hoja inferior.
- Carga por `<script>` de CDN: `xlsx` y `@supabase/supabase-js@2` (global
  `window.supabase`).
- `<script type="module" src="js/app.js">` — único punto de entrada; todo
  lo demás se importa desde ahí vía módulos ES nativos (sin bundler, así
  que el proyecto debe servirse por HTTP, nunca `file://`).

Nota sobre el `<meta name="theme-color">` y el `<title>`: llevan un valor
estático de arranque en el HTML, pero `app.js#boot()` los sobrescribe con
`branding.js`/`--brand-secondary` apenas corre el JS — ver
[01-vision-general.md](./01-vision-general.md#plantilla-reutilizable).

## `js/app.js` — bootstrap y navegación

### Páginas y navegación (`nav(page)`)

Activa la pestaña (`.tn-item`/`.mbn-item` con `data-page` coincidente),
muestra el `#page-X` correspondiente, actualiza el título (objeto
`TITLES`), y llama al `render*`/`refresh*` de la vista. `_current`
(variable de módulo) guarda cuál está activa — la usan `onAdded`/
`onEgresado`/el callback de `sync.onChange` para saber qué repintar tras un
cambio.

**Botones "virtuales" de la bottom nav móvil** (`[data-page="movimientos"]`,
`[data-page="accesos"]`) nunca llegan a `nav()` tal cual — el listener de
clic los traduce a la sub-página vista por última vez (`_movSub`/`_accSub`,
default `'ingresos'`/`'voluntarios'`) antes de llamar `nav()`. Cada uno
tiene su propia barra de sub-tabs (`#m-subnav-mov`/`#m-subnav-acc`,
`.m-subnav-btn[data-subpage]`) que `_syncMovSubnav(page)`/
`_syncAccSubnav(page)` muestran (`.show`) solo cuando la página activa es
una de las dos que agrupan, y mantienen sincronizado cuál sub-tab queda
`.active`. En desktop ambos pares siguen siendo pestañas independientes de
`.tn-nav` — este mecanismo es exclusivo de `.mbn-item`.

Los enlaces `data-nav="<page>"` (p.ej. "Ver todo →" en Resumen, o la flecha
"Ver en Historial" de las tarjetas de Ingresos/Egresos) se resuelven con un
único listener delegado en `document`: navega, y si además trae
`data-tipo`/`data-date` (solo la flecha de Historial los usa), llama a
`registro.js#focusRegistro(tipo, date)` tras el `nav()` para preseleccionar
el filtro y hacer scroll hasta el día correcto.

### RBAC de navegación (`applyRBAC()`)

Se ejecuta en cada cambio de sesión (`checkAuth()`). Reglas:

- Resetea `display` a `''` en todas las pestañas primero.
- **"Usuarios"** (`.tn-item[data-page="voluntarios"]`, y en móvil
  `.mbn-item[data-page="accesos"]` — ver `#m-subnav-acc` arriba) se oculta
  entera si `!auth.hasAdminRights()` — antes solo mostraba un mensaje
  dentro de la pestaña, ahora la pestaña misma desaparece del nav (desktop
  y móvil).
- **"Grupos"** (`.tn-item[data-page="grupos"]`, y en móvil el sub-tab
  `#m-subnav-acc .m-subnav-btn[data-subpage="grupos"]`) se oculta si
  `!auth.isSuperAdmin()` — más estricto que Usuarios: un admin de grupo
  normal sí ve la pestaña combinada "Accesos" en móvil, pero solo con el
  sub-tab "Usuarios" disponible. El selector de grupo
  (`#grupo-switch`/`#grupo-switch-m`) sigue la misma regla
  (`isSuperAdmin()`), y se repinta (`_paintGrupoSwitch()`) cuando aplica.
- **"Despachos"** (`[data-page="despachos"]`) se oculta **para cualquier
  rol**, siempre — vía CSS `!important` (`css/styles.css`), porque este
  reset de `applyRBAC()` corre en cada sesión y de otro modo la
  reaparecería. Código/RPCs intactos, solo inalcanzable desde el nav.
- El coordinador del área `general` (consulta sin edición, ver
  [05-autenticacion.md](./05-autenticacion.md)) pierde la pestaña "Ingreso
  Rápido" del switcher (`#qa-switch-ingreso`/`#qa-switcher`) — se fuerza el
  modo a `'egreso'`. Egreso Rápido no se oculta (genera una comanda de
  salida real, no es "editar mi propio inventario").

### `checkAuth()`

Alterna entre el muro de login y el app-shell según `auth.isLoggedIn()` +
`auth.hasPlatformAccess()`. Defensivo: una sesión guardada cuyo rol/área ya
no tiene acceso se cierra automáticamente antes de mostrar el shell. Cada
transición real login-wall → app-shell (`freshLogin`, distinto de solo
recargar/reautenticar) navega a **Resumen** — la pestaña por defecto al
iniciar sesión, sin importar en qué pestaña quedó la sesión anterior.

### `boot()` — secuencia de arranque

1. Sobrescribe título/marca/`theme-color` desde `branding.js`/CSS (ver
   arriba).
2. Rellena el badge de versión (`js/version.js#APP_VERSION`).
3. Reloj de la statusbar (`setInterval` 1s).
4. Listeners de navegación por pestaña + el listener delegado de
   `data-nav`.
5. `auth.init()` + `auth.onChange(checkAuth)`.
6. `store.init()` — carga/siembra el catálogo (ver
   [03-estado-local-store.md](./03-estado-local-store.md)).
7. Migración one-shot (`migr_und_cleaned`, `localStorage`): limpia un
   sufijo `" und"` heredado de un seed viejo.
8. `checkpoints.autoBackup()`.
9. `initAdmin({onDataChange})` — engancha el muro de login/panel de
   perfil; su callback refresca la vista activa tras restaurar un
   checkpoint o resetear.
10. `modal.init()` + `initComunicados()`.
11. `renderIngresoRapido(...)` / `renderEgresoRapido(...)` — montan el
    panel persistente; sus callbacks (`onAdded`/`onSubmitted`) refrescan la
    vista activa y cierran la hoja móvil.
12. Wiring del switcher Ingreso↔Egreso, FAB y backdrop móviles.
13. `sync.onChange(...)` — rehidrata `store.items`/`store.logs` desde
    IndexedDB y repinta la vista activa (`conteo`/`ingresos`/`egresos`/
    `resumen`) tras cada ciclo de sync.
14. `sync.listenRealtime()`.
15. Listeners `online`/`offline`/`visibilitychange` (reintenta sync +
    `checkForUpdate()` al recuperar foco).
16. Timer de red de seguridad: `sync.run()` cada 30s si `sync.enabled`.
17. `nav('resumen')` — vista inicial.
18. `checkAuth()` — decide muro de login vs. app-shell.
19. Registro del Service Worker + recarga automática al detectar un SW
    nuevo tomando control.
20. `checkForUpdate()`.

### Auto-actualización (`checkForUpdate()`)

Antes de conformarse con lo cacheado, compara `APP_VERSION` contra
`js/version.js` pedido directo a la red (`cache:'no-store'`). Si cambió,
purga Service Worker + Cache Storage y recarga una sola vez — evita tener
que limpiar caché dispositivo por dispositivo tras cada deploy. Se dispara
al boot y en cada `visibilitychange` a visible.

### `refreshFromCloud()`

Handler del clic sobre el pill de sincronización: `sync.pullAll()` (reinicia
el checkpoint incremental y trae todo fresco) + repinta la vista activa.

## `css/styles.css`

Una única hoja de estilos, sin preprocesador.

### Paleta de marca

```css
:root {
  --brand-primary:#F59E0B;   /* botones/acentos/tabs activos/hero */
  --brand-secondary:#111827; /* sidebar/topnav/botones primarios */
  --sidebar: var(--brand-secondary);
  --side2: color-mix(in srgb, var(--brand-secondary) 80%, black);
  --amber: var(--brand-primary);
  --amber-d: color-mix(in srgb, var(--brand-primary) 80%, black);
  --amber-bg: color-mix(in srgb, var(--brand-primary) 15%, white);
  --amber-ink: color-mix(in srgb, var(--brand-primary) 14%, black);
  --amber-border-lt: color-mix(in srgb, var(--brand-primary) 42%, white);
  --overlay: color-mix(in srgb, var(--brand-secondary) 55%, transparent);
  /* ... colores de estado independientes de la marca: --red/--green/--teal/--blue ... */
}
```

Todo tinte que use el color principal o secundario en el resto del archivo
— incluidos los decorativos puntuales (badges, focos de input, sombras de
botón) — se expresa con `color-mix(in srgb, var(--amber) N%, transparent)`
en vez de un `rgba(...)` fijo, precisamente para que cambiar
`--brand-primary`/`--brand-secondary` reskinee la app entera sin perseguir
valores sueltos. El color de texto general (`--t1`) es intencionalmente
**independiente** de `--brand-secondary` (coincide en el valor por defecto,
pero no está atado) — cambiar el color de marca no debe teñir el texto del
cuerpo.

### Prefijos de clase por módulo

| Prefijo | Vista/componente |
|---|---|
| `tn-`, `m-`, `stb-` | Navegación superior / topbar móvil / statusbar |
| `sync-` | Pill de estado de sincronización |
| `auth-`, `adm-` | Botón de perfil y panel de administración (login/perfil/categorías/respaldos) |
| `qa-` | Panel de Ingreso Rápido y chrome compartido con Egreso (switcher, cabecera, pie) |
| `eg-` | Egreso Rápido (destino, carrito, envío) |
| `cnt-`, `ctc-`, `inv-`, `ic-` | Insumos: filtros/pestañas de categoría y tarjeta de insumo |
| `reg-` | Historial |
| `ing-`, `idc-`, `idm-` | Reportes de Ingresos/Egresos (tarjetas de día + modal de detalle) |
| `rsm-`, `hero-`, `stats-` | Resumen (hero "Centro Operativo" + estadísticas) |
| `tl-`, `tag-`, `fbtn` | Comunicados |
| `vol-` (inline en el JS) | Usuarios — mayormente estilos inline en `voluntarios.js` |
| `grp-` | Grupos de extensión (`views/grupos.js`, super_admin-only) |
| `toast-` | Notificaciones flotantes |
| `fab`, `mbn-` | FAB y bottom nav móviles |

## Ciclo de datos entre módulos

```
config.js ──► auth.js ──► sync.js ──► db.js (IndexedDB)
                 │            │            ▲
                 │            ▼            │
                 └────────► store.js ──────┘
                                 │
                                 ▼
                    views/*.js (conteo, ingresorapido,
                    egresorapido, registro, ingresos,
                    egresos, resumen, comunicados, voluntarios,
                    grupos)
                                 │
                                 ▼
                            app.js (orquesta
                            navegación + refrescos)
```

- `store.js` es la única fuente de verdad en memoria (`store.items`,
  `store.logs`, `store.categories`, `store.communications`). Las vistas
  leen de ahí y llaman a sus métodos para mutar — nunca tocan `db.js`
  directamente.
- `store.js` persiste cada mutación en IndexedDB de inmediato y, si aplica,
  encola la operación en `sync.js`.
- **Egreso Rápido es la excepción**: `create_comanda_rapida` se llama
  directo (sin pasar por `sync.enqueue`) porque es un documento de negocio
  irreversible que exige conexión — ver
  [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md).
- `sync.js` corre en dos direcciones (push/pull) y notifica a los
  suscriptores (`sync.onChange`) tras cada ciclo; `app.js` usa eso para
  rehidratar `store.items`/`store.logs` y repintar.
