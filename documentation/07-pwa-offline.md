# 7. PWA / Offline (`manifest.json`, `sw.js`, `js/checkpoints.js`)

## `manifest.json`

Manifest estándar de PWA instalable:

- `name` / `short_name`: "Inventario UCV — Conteo Físico" / "Inventario UCV".
- `start_url`: `./index.html`, `display: standalone` (se abre sin chrome de
  navegador al instalarse).
- `background_color` / `theme_color`: `#F7F5F2` / `#111827` (coherente con
  el `<meta name="theme-color">` de `index.html`).
- `orientation: portrait-primary`.
- Un solo icono declarado, `icon.svg` (`sizes: any`, `purpose: any`) — no
  hay variantes PNG por tamaño ni icono `maskable` dedicado.

`index.html` complementa esto con meta tags de iOS
(`apple-mobile-web-app-capable`, `apple-touch-icon`, etc.) para soportar
"Agregar a inicio" también en Safari/iOS, que no lee `manifest.json`
completo.

## `sw.js` — Service Worker

Cache versionado por string literal: `CACHE = 'ucv-inventario-v41'`
(bump 2026-07-19, corte de conexión al proyecto Supabase compartido — ver
`05-autenticacion.md`/`08-base-de-datos-PENDIENTE.md`). El número de
versión se actualiza a mano en cada release (se ve reflejado también en el
badge visual `v41` de `index.html` — hay que mantener ambos sincronizados
manualmente, no hay build step que lo automatice). `js/env-config.js`
(nuevo 2026-07-19, generado por `build.js`) se agregó a `ASSETS`.

- **`install`**: pre-cachea la lista completa de assets propios
  (`ASSETS`) — todos los módulos JS, el HTML, el CSS, el manifest y el
  icono. **Nota:** cualquier archivo nuevo agregado a `js/` (por ejemplo,
  si se agrega una vista nueva) debe añadirse a mano a este array o no se
  cacheará para uso offline.
- **`activate`**: borra cualquier cache anterior cuyo nombre no coincida
  con `CACHE` (limpieza de versiones viejas) y toma control inmediato de
  los clientes (`self.clients.claim()`).
- **Estrategia de fetch**, diferenciada por tipo de recurso:
  - **Recursos externos** (`url.origin !== location.origin`, es decir,
    Supabase y los CDN de fuentes/xlsx) → **no se interceptan en
    absoluto**, pasan directo a la red. Evita cachear respuestas de la API
    o servir datos desactualizados desde el SW.
  - **JS / CSS / HTML / raíz** (`.js`, `.css`, `.html`, `/`) → estrategia
    **red primero, caché de respaldo**: intenta `fetch`, si responde OK
    actualiza la caché; si falla (offline), sirve la versión cacheada. Así
    el código de la app siempre está lo más fresco posible cuando hay red,
    pero sigue funcionando offline.
  - **Todo lo demás** (imágenes, el icono, etc.) → estrategia **caché
    primero**: sirve de caché si existe, si no hace fetch y cachea la
    respuesta para la próxima vez.

`app.js` complementa esto registrando el SW al boot y forzando un
`window.location.reload()` en cuanto un SW nuevo toma control
(`controllerchange`), para que los usuarios no queden atrapados en una
versión vieja del JS mientras el SW actualiza la caché en segundo plano.

## Checkpoints (`js/checkpoints.js`) — respaldo local del conteo

Complementa el modelo offline: son snapshots completos del estado
(`store.items` + `store.logs`) guardados en el store `checkpoints` de
IndexedDB (ver [03-estado-local-store.md](./03-estado-local-store.md)),
pensados para no perder un inventario a medias si algo sale mal
localmente (no son respaldos en la nube).

- **`create(creadoPor)`**: arma un snapshot con `id`, `created_at`, quién lo
  creó, un resumen (`contados/total/unidades`) y los datos completos
  (subconjunto de campos de cada ítem + logs). Tras crear, recorta el
  historial a `MAX_KEEP = 12` (borra los más viejos) — `_prune()`.
- **`autoBackup()`**: se llama en cada boot (`app.js`). Crea un checkpoint
  automático solo si el último tiene más de `AUTO_HORAS = 6` horas de
  antigüedad (o no hay ninguno) **y** hay al menos un insumo contado (no
  tiene sentido respaldar un catálogo entero en cero).
- **`restore(id)`**: sobrescribe `store.items`/`store.logs` con los datos
  del snapshot — hace merge por `id` contra el catálogo *actual* (no
  reemplaza el array entero a ciegas), para no perder insumos que se hayan
  agregado al catálogo después de crear ese checkpoint. Marca todo como
  `dirty: true` (candidato a re-subir en el próximo sync). Es una acción
  sensible: en la UI (`admin.js`) requiere confirmación explícita
  (`confirm()` nativo) y solo está disponible en el panel de coordinador
  admin.
- **`remove(id)`**: borra un checkpoint puntual.

Estos checkpoints **no** se sincronizan a Supabase desde este código (viven
solo en IndexedDB local) — aunque `supabase/schema.txt` sí incluye una tabla
`checkpoints` en el esquema remoto, lo cual sugiere que podría haber, o
haberse planeado, una sincronización de respaldos a la nube que el código
JS actual no implementa. Punto a confirmar cuando se revise la BD en vivo.
