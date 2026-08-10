# 2. Arquitectura frontend

## `index.html` — shell de la app

Un único documento HTML que actúa de *app shell*. Estructura relevante:

- `#login-wall` — contenedor vacío; `admin.js` inyecta el formulario de login
  cuando no hay sesión de coordinador (ver
  [05-autenticacion.md](./05-autenticacion.md)).
- `#app-shell` — todo lo demás, oculto (`display:none`) hasta que hay sesión.
  - `<header class="topnav">` (desktop) y `<div class="m-topbar">` (móvil):
    marca, navegación entre páginas, pill de estado de sincronización
    (`#sync-pill` / `#sync-pill-m`) y botón de coordinador (`#auth-btn`).
  - `<div class="statusbar">`: reloj en vivo y título de la página activa
    (solo desktop).
  - `<div class="app">`:
    - `<aside class="quickadd">` — panel de agregado rápido, persistente,
      renderizado por `quickadd.js`.
    - `<main class="main">` — cinco contenedores de página
      (`#page-conteo`, `#page-registro`, `#page-resumen`, `#page-despachos`
      — nueva 2026-07-24 —, `#page-voluntarios`), todos montados en el DOM a
      la vez; `app.js` alterna su `display` para navegar (no hay router de
      URL/history).
  - FAB (`#fab-qa`) + backdrop + bottom nav — solo para móvil (< 820px),
    abren/cierran el panel de agregado rápido como hoja inferior.
- Carga por `<script>` de CDN: `xlsx` y `@supabase/supabase-js@2` (variable
  global `window.supabase`, usada solo para Realtime).
- `<script type="module" src="js/app.js">` — único punto de entrada de la
  aplicación; todo lo demás se importa desde ahí vía módulos ES.

No hay bundler: cada `import`/`export` en `js/**/*.js` se resuelve en tiempo
de carga por el navegador. Por eso el proyecto **debe servirse por HTTP**
(`npx serve .` o `python -m http.server`), nunca abrirse como `file://`
(los módulos ES lo bloquean por CORS).

## `js/app.js` — bootstrap y navegación

Punto de entrada. Responsabilidades:

1. **Registro de páginas y navegación** (`nav(page)`): activa la pestaña,
   muestra/oculta el contenedor correspondiente, actualiza el título, y
   llama al `render*` de la vista (`conteo.js`, `registro.js`, `resumen.js`,
   `despachos.js` — nueva 2026-07-24 —, `voluntarios.js`).
2. **RBAC de navegación** (`applyRBAC()`): **simplificado 2026-07-19** — ya
   no oculta ninguna pestaña por rol (antes ocultaba *Bitácora*/*Resumen*/
   *Voluntarios* según `ADMIN_EMAILS`, `js/config.js`, eliminado). Solo
   `admin`/`coordinador` con acceso llegan al app shell (`checkAuth()`
   filtra antes), así que las 5 pestañas (4 originales + "Despachos") quedan
   visibles para cualquiera que esté dentro — lo que varía por rol es el
   *contenido* de la pestaña
   Usuarios, no su visibilidad. Ver detalle en
   [05-autenticacion.md](./05-autenticacion.md).
3. **`checkAuth()`**: alterna entre el muro de login y el app shell según
   `auth.hasPlatformAccess()` (renombrado de `isCoord()` el 2026-07-19).
   Se ejecuta al boot y cada vez que cambia la sesión (`auth.onChange`).
4. **`boot()`** — secuencia de arranque, en orden:
   - Reloj de la statusbar (`setInterval` cada 1s).
   - Listeners de navegación por pestañas.
   - `auth.init()` + suscripción a cambios de sesión.
   - `store.init()` — carga/siembra el catálogo (ver
     [03-estado-local-store.md](./03-estado-local-store.md)).
   - `checkpoints.autoBackup()` — respaldo automático si aplica.
   - `initAdmin(...)` — engancha el botón de coordinador; su callback
     `onDataChange` refresca la vista activa tras restaurar un checkpoint o
     resetear.
   - `renderQuickAdd(...)` — monta el panel persistente de agregado rápido;
     su callback `onAdded` refresca la vista activa y cierra la hoja móvil.
   - Wiring del FAB y backdrop móviles.
   - `sync.onChange(...)` — cuando `sync.js` completa un ciclo, rehidrata
     `store.items`/`store.logs` desde IndexedDB y repinta.
   - `sync.listenRealtime()` — abre el canal de Realtime si hay
     credenciales.
   - Listeners `online`/`offline`/`visibilitychange` para reintentar sync al
     recuperar conexión o foco.
   - Timer de red de seguridad: si `sync.enabled`, corre `sync.run()` cada
     30s como respaldo (en caso de que Realtime falle en silencio).
   - `nav('conteo')` — vista inicial.
   - `checkAuth()` — decide si mostrar el muro de login.
   - Registro del Service Worker (`navigator.serviceWorker.register`), con
     recarga automática al detectar un SW nuevo tomando control
     (`controllerchange`).
5. **`refreshFromCloud()`**: handler del clic sobre el pill de
   sincronización — fuerza un `sync.pullAll()` (reinicia el checkpoint
   incremental y trae todo fresco) y repinta la vista activa.

### Modelo de páginas

No hay router — es un *single page* con 4 vistas montadas simultáneamente en
el DOM, controladas por `display:none/block` desde `nav()`. El estado de cuál
página está activa vive en la variable de módulo `_current`, no en la URL
(no hay deep-linking ni back-button entre páginas).

## `css/styles.css`

Una única hoja de estilos (~372 líneas), sin preprocesador. Sigue el tema
heredado de AcopioUCV: variables CSS (`--bdr`, `--s1`, `--s2`, `--amber`,
`--teal`, `--red`, `--sidebar`, radios `--r-sm/--r-xl`, sombras `--sh-lg`)
definidas presumiblemente en un bloque `:root` (no confirmado línea por línea
en esta pasada, pero referenciado extensamente). Tipografías: *Space
Grotesk* (títulos/marca), *Inter* (cuerpo), *JetBrains Mono* (números/reloj).

Prefijos de clase por módulo (facilita ubicar estilos de una feature):

| Prefijo | Vista/componente |
|---|---|
| `tn-`, `m-`, `stb-` | Navegación superior / topbar móvil / statusbar |
| `sync-` | Pill de estado de sincronización |
| `auth-`, `adm-` | Botón de coordinador y modal/panel de administración |
| `qa-` | Panel de agregado rápido (`quickadd.js`) |
| `cnt-`, `ctc-` | Vista de conteo y su tarjeta de progreso |
| `reg-` | Bitácora |
| `rsm-` | Resumen |
| `vol-` (inline, no en el CSS central) | Voluntarios usa mayormente estilos inline en el propio `voluntarios.js` |
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
                    views/*.js (conteo, quickadd,
                    registro, resumen, voluntarios)
                                 │
                                 ▼
                            app.js (orquesta
                            navegación + refrescos)
```

- `store.js` es la única fuente de verdad en memoria (`store.items`,
  `store.logs`). Las vistas leen de ahí y llaman a sus métodos
  (`registrar`, `setTotal`, `addNuevo`, `deleteLog`, `resetItem`) para
  mutar — nunca tocan `db.js` directamente.
- `store.js` persiste cada mutación en IndexedDB (`db.js`) de inmediato y,
  si `sync.enabled`, encola la operación en `sync.js` para subirla a
  Supabase.
- `sync.js` corre en dos direcciones: **push** (vacía la cola local hacia la
  API REST/RPC de Supabase) y **pull** (trae cambios remotos y los escribe en
  IndexedDB). Notifica a los suscriptores (`sync.onChange`) tras cada ciclo;
  `app.js` usa eso para rehidratar `store.items`/`store.logs` y repintar.
