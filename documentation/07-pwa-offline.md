# 7. PWA / Offline (`manifest.json`, `sw.js`, `js/checkpoints.js`)

## `manifest.json`

- `name`/`short_name`: "GBSInventario — Gestión de Inventario" /
  "GBSInventario" — hay que editarlos a mano al rebrandear (ver
  [01-vision-general.md](./01-vision-general.md#plantilla-reutilizable));
  el navegador los lee como archivo estático antes de que exista una página
  donde JS pueda sobrescribirlos.
- `start_url: ./index.html`, `display: standalone`.
- `background_color`/`theme_color`: `#F7F5F2`/`#111827` (valor de
  arranque; `theme_color` real del navegador la sobrescribe `app.js#boot()`
  con `--brand-secondary` en tiempo de ejecución, pero `manifest.json`
  sigue siendo estático — algunos flujos de instalación/task-switcher lo
  leen antes de que corra JS).
- Un solo ícono, `icon.svg` (`sizes: any`) — también estático, otra
  excepción de rebranding (ver `js/branding.js`).

`index.html` complementa esto con meta tags de iOS
(`apple-mobile-web-app-capable`, `apple-touch-icon`, etc.) para "Agregar a
inicio" en Safari, que no lee `manifest.json` completo.

## `sw.js` — Service Worker

Cache versionado por string literal (`CACHE = 'gbs-inventario-vX.YY'`),
sincronizado a mano con `js/version.js#APP_VERSION` en cada commit&push a
`main` (regla en `CLAUDE.md` — no automatizado por un build step).

- **`install`**: pre-cachea la lista completa `ASSETS` — todos los módulos
  JS (incl. cada `views/*.js` y `components/*.js`), el HTML, el CSS, el
  manifest y el ícono. **Cualquier archivo JS nuevo debe añadirse a mano a
  este array** o no estará disponible offline.
- **`activate`**: borra cualquier caché anterior cuyo nombre no coincida
  con `CACHE`, y `self.clients.claim()`.
- **Estrategia de fetch**, por tipo de recurso:
  - **Externos** (`url.origin !== location.origin`, Supabase/CDN) → no se
    interceptan, pasan directo a la red.
  - **JS / CSS / HTML / raíz** → **red primero, caché de respaldo**:
    `fetch(..., {cache:'reload'})` (ignora también el caché HTTP del
    navegador — necesario porque `vercel.json` fija `Cache-Control` largo
    en `/js` y `/css`, y sin `cache:'reload'` este "red primero" seguiría
    sirviendo una respuesta vieja sin darse cuenta), actualiza caché si
    responde OK, cae al caché si falla.
  - **Todo lo demás** (ícono, imágenes) → caché primero, cachea en el
    primer fetch.

`app.js` complementa esto registrando el SW al boot, forzando un
`window.location.reload()` en cuanto un SW nuevo toma control
(`controllerchange`), y con `checkForUpdate()` (ver
[02-arquitectura-frontend.md](./02-arquitectura-frontend.md#auto-actualización-checkforupdate))
que compara `APP_VERSION` contra la red y purga Service Worker + Cache
Storage si detecta una versión nueva — evita depender de que cada
dispositivo limpie caché manualmente tras un deploy.

## Checkpoints (`js/checkpoints.js`) — respaldo local del conteo

Snapshots completos del estado (`store.items` + `store.logs`) guardados en
el store `checkpoints` de IndexedDB (ver
[03-estado-local-store.md](./03-estado-local-store.md)) — para no perder
un inventario a medias si algo sale mal localmente. No son respaldos en la
nube.

- **`create(creadoPor)`**: snapshot con `id`, `created_at`, quién lo creó,
  un resumen (`contados/total/unidades`) y los datos completos. Tras
  crear, recorta a `MAX_KEEP = 12` (`_prune()`, borra los más viejos).
- **`autoBackup()`**: llamado en cada boot. Crea un checkpoint automático
  solo si el último tiene más de `AUTO_HORAS = 6` horas (o no hay ninguno)
  **y** hay al menos un insumo contado.
- **`restore(id)`**: hace merge por `id` contra el catálogo *actual* (no
  reemplaza el array entero a ciegas) — no pierde insumos agregados
  después de crear ese checkpoint. Marca todo como `dirty:true` (candidato
  a re-subir en el próximo sync). Acción sensible: en la UI
  (`admin.js`, admin-only) exige confirmación vía `confirmDialog` danger,
  nunca el `confirm()` nativo del navegador.
- **`remove(id)`**: borra un checkpoint puntual.

Estos checkpoints viven solo en IndexedDB local, no se sincronizan a
Supabase.
