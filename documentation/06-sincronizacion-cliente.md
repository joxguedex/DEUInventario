# 6. Sincronización con Supabase — lado cliente (`js/sync.js`)

> **Reescrito 2026-07-19** — corte de conexión del proyecto Supabase externo
> (`bwdipsshosclqoxbjbho`) al proyecto compartido con UCVAcopio/UCVComandas
> (`fndrmxjykrtoddhstbyv`, esquema `new_schema_archive`). A diferencia de la
> versión anterior de este documento, lo de abajo **sí está validado contra
> la BD real** (RPCs probadas end-to-end, publicación de Realtime
> confirmada) — ver [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md),
> que dejó de estar pendiente.

## Patrón general: offline-first con cola local

`sync.js` no sincroniza en tiempo real por defecto — aplica un patrón de
**cola local + reconciliación periódica**:

1. Toda mutación de negocio (`store.registrar`, `addNuevo`, `deleteLog`,
   `resetItem`) se aplica primero en memoria + IndexedDB, y **además** se
   encola (`sync.enqueue(table, payload)`) en el store `queue` de
   IndexedDB.
2. `enqueue()` dispara `runDebounced()` — agrupa ráfagas de cambios en una
   sola corrida de sync 500ms después del último encolado.
3. `sync.run()` es el ciclo completo: `_push()` (sube la cola) seguido de
   `_pull()` (baja cambios remotos). Se re-dispara solo (`this._rerun`) si
   llegó una señal de Realtime o un fallo de auth a mitad de ciclo, para no
   perder eventos que llegaron mientras estaba en vuelo.
4. Si no hay conexión (`navigator.onLine === false`), no intenta nada y
   solo marca `online = false`.
5. Fuera de eso, hay tres disparadores adicionales de `run()`:
   - Evento `online` del navegador.
   - `visibilitychange` a visible (pestaña/app vuelve a primer plano).
   - Un `setInterval` cada 30s como red de seguridad, **solo si**
     `sync.enabled` (hay credenciales configuradas).

## Checkpoints de pull (versionados en `localStorage`)

El pull es **incremental**: guarda en `localStorage['ucv-inv-ls5']` el
`updated_at` más alto visto en la última respuesta del servidor, y en la
siguiente corrida solo pide filas con `updated_at > checkpoint`.

El nombre de la clave ya va por la quinta versión (`ls` → `ls2` → `ls3` →
`ls4` → `ls5`), cada una documentada en el código como corrección de un bug
real de producción:

- **v1** (`ucv-inv-ls`): guardaba el epoch del *reloj del cliente*, no del
  servidor — un teléfono desfasado se saltaba cambios ajenos.
- **v2** (`ucv-inv-ls2`): un dispositivo que perdía IndexedDB (frecuente en
  móvil, el navegador desaloja storage) quedaba con el checkpoint
  "adelantado" respecto a un catálogo local vacío, y el inventario se
  quedaba en cero para siempre.
- **v3**: cada dispositivo hace un pull completo al detectar catálogo vacío
  (`store.init()` llama `sync.resetCheckpoint()` en ese caso) y de ahí en
  adelante vuelve al incremental.
- **v4** (2026-07-19): corte al proyecto Supabase compartido — el
  checkpoint de v3 referencia `updated_at`/`client_id` del proyecto externo
  viejo, sin relación con el catálogo real del proyecto nuevo. Sin este
  cambio de nombre de clave, el pull incremental habría quedado "convencido"
  de que ya trajo todo y no habría bajado nada del catálogo real.
- **v5** (actual, 2026-07-27): reestructuración de categorías — el enum
  `product_type` se recreó y **todos** los productos se reclasificaron en una
  sola migración contra producción (mismo `updated_at` en las ~1957 filas).
  Un dispositivo cuyo checkpoint v4 ya estaba adelantado respecto a ese
  `updated_at` (o que hizo un pull parcial justo alrededor de ese instante) se
  quedaba con el `categoria` local en la clave VIEJA para siempre — ninguna
  de las 13 categorías nuevas la reconocía, así que ese insumo caía en "Sin
  categoría" en Conteo/Bitácora, y un coordinador de esa área no veía nada
  (`store.visibleItems()`, ver [05-autenticacion.md](./05-autenticacion.md)).
  Forzar el pull completo para todos los dispositivos corrige el `categoria`
  de cada producto contra el valor real de la BD, sin importar qué tan
  desactualizado estuviera el checkpoint local. Verificado localmente:
  un ítem sembrado a mano con `categoria: 'higiene'` (clave vieja) y
  checkpoint v4 adelantado se corrigió solo a `'higiene_personal'` en el
  siguiente pull tras este cambio.

**Importante para quien opere la BD:** el checkpoint solo avanza hasta
`maxUpdated` de las filas *efectivamente aplicadas* en esa corrida — si el
loop de paginación se corta o falla a mitad, no se pierde el resto.

## Lápidas (`tombstones`)

`localStorage['ucv-inv-tomb2']` (renombrado de `'ucv-inv-tomb'` el
2026-07-19, mismo corte de proyecto que `LS_KEY` arriba) guarda un set de
`client_id` de insumos borrados/fusionados en la nube (ej. tras un
`merge-duplicates.sql`). Es necesario porque `store.init()` re-siembra desde
`seed.js` cualquier insumo del catálogo original que no encuentre en
IndexedDB — sin esta lista, un insumo fusionado "resucitaría" localmente en
cada arranque y se volvería a subir. `_pull()` alimenta esta lista cada vez
que encuentra una fila remota con `deleted_at` no nulo.

## Drenaje de la cola al cortar (`_drainQueueOnce`, nuevo 2026-07-19)

La cola de sync (`db.qGetAll()`/store `queue` de IndexedDB) pudo quedar con
operaciones pendientes (conteos/altas de insumos) que referencian `client_id`
del catálogo del proyecto **externo viejo** — no existen en el catálogo del
proyecto nuevo, y `apply_count` fallaría con "Producto no existe" para cada
una. Al arrancar con el código de este corte, `sync.run()` llama primero a
`_drainQueueOnce()`, que vacía la cola (`db.qClear()`) **una sola vez**
(marca `localStorage['ucv-inv-cutover-new-schema-archive']` para no repetirlo
en corridas siguientes) — cualquier cambio local sin subir de antes del
corte se pierde a propósito, documentado, en vez de fallar en silencio
operación por operación contra el proyecto nuevo.

## `_push()` — subir la cola local

Agrupa las operaciones pendientes (`db.qGetAll()`) en dos grupos con
estrategias distintas:

1. **`products`** (altas/ediciones de insumos) — **absolutas, con
   coalescing**: si hay varias operaciones encoladas para el mismo `id`, se
   queda solo con la última (`Map` por `payload.id`) y las sube todas juntas
   en un único `POST /rest/v1/products?on_conflict=client_id` con
   `Prefer: resolution=merge-duplicates,return=minimal` (upsert por lote).
   El payload (`productPayload()`) traduce el modelo local
   (`nombre`, `categoria`, `unidad`, `umbral`) al remoto (`name`,
   `type` vía mapeo de categoría, `unidad`, `umbral`), usando
   `client_id: item.id` como clave de upsert.
2. **`conteo` / `uncount` / `delcount`** (registros de conteo, deshacer,
   borrar) — **sin coalescing, en orden cronológico estricto** (`ts`),
   porque son operaciones incrementales, no absolutas: reordenarlas
   cambiaría el resultado. Cada una llama a un RPC distinto:
   - `conteo` → `POST /rest/v1/rpc/apply_count` con
     `{ p_client_op_id, p_product_client_id, p_delta, p_counted_by }`. El
     `client_op_id` es el `id` del log local — hace el RPC **idempotente**
     (reintentar la misma operación no la duplica).
   - `uncount` → `POST /rest/v1/rpc/uncount_item` con
     `{ p_product_client_id }`.
   - `delcount` → `POST /rest/v1/rpc/delete_count` con
     `{ p_client_op_id }`.

   Si una operación de este grupo falla con un status recuperable (ver
   abajo), el loop **se detiene ahí** (`break`) para no aplicar operaciones
   posteriores fuera de orden en la próxima corrida.

### Clasificación de errores HTTP (`_isPermanent`)

```js
status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status)
```

- **401 / 403** → recuperable (RLS/rate limit), se queda en la cola. **Actualizado
  2026-07-19**: ya no dispara ningún refresh de token — no existe sesión con JWT que
  renovar (login por `person_login`, sin Supabase Auth, ver `05-autenticacion.md`);
  todo el tráfico de `sync.js` viaja siempre con la anon key.
- **408 / 429** → temporales (timeout / rate limit) — se reintentan tal
  cual, quedan en la cola.
- **Resto de 4xx** (400, 404, 409, 422, etc.) → se consideran "dato
  inválido" y **se descartan de la cola** aunque hayan fallado, para no
  atascarla indefinidamente con basura. Esto es una decisión de diseño
  explícita: prioriza que la cola no se trabe sobre no perder silenciosamente
  una operación mal formada.
- **5xx / errores de red** → no clasificados como permanentes; se
  propagan como excepción y abortan el `_push()` completo (la cola se
  conserva intacta para reintentar).

Al final, borra de IndexedDB (`db.qBulkDel`) los `id` de operación
confirmados (éxito o descartados como permanentes).

## `_pull()` — bajar cambios remotos

```
GET /rest/v1/products
  ?updated_at=gt.{checkpoint}
  &select=id,client_id,name,type,unidad,umbral,updated_at,deleted_at,
          inventory(qnty,last_counted_at,last_counted_by)
```

Paginado manual vía header `Range` (bloques de 1000), hasta que una página
devuelve menos de `limit` filas.

Por cada fila remota:
- Si `deleted_at` no es nulo → borra el ítem local (`db.del`) y lo agrega a
  las lápidas (no se re-siembra).
- Si no, la traduce al modelo local y hace upsert (`db.bulkPut`) preservando
  cualquier campo local que no venga del servidor (`{ ...(local || {}), ... }`).
  Reglas notables de traducción:
  - `contado` se deriva como `qnty > 0 || !!last_counted_at` — es decir, un
    conteo confirmado en cero *sigue contando* como "contado" (distingue
    "no fui a revisar" de "fui, miré, no había nada").
  - `nombre` viene directo de `name` remoto, sin transformación.
  - `umbral` cae a `10` si no viene ni del remoto ni de lo local (default
    histórico).

Al terminar, `localStorage['ucv-inv-ls4']` avanza al `updated_at` máximo
visto — **no** al momento actual del reloj local (evita el bug de v1
descrito arriba).

## Realtime (`listenRealtime` / `stopRealtime`)

Usa el SDK `@supabase/supabase-js` (cargado por CDN, expuesto como
`window.supabase`) **solo** para el canal de WebSocket — el resto de la app
usa `fetch` puro. Se suscribe a eventos `postgres_changes` (`event: '*'`)
sobre las tablas `inventory` y `products` del schema `new_schema_archive`
(**actualizado 2026-07-19** — antes `public`, hardcodeado, del proyecto
externo viejo; ahora usa `DB_SCHEMA` como el resto de `sync.js`); cualquier
evento simplemente dispara `runDebounced()` (no procesa el payload del
evento directamente, actúa como señal de "hay algo nuevo, ve a buscarlo" —
delega la reconciliación real al ciclo normal de pull).

Reconexión con backoff exponencial (tope 30s) ante `CHANNEL_ERROR` /
`TIMED_OUT` / `CLOSED`. Requiere que las tablas `inventory` y `products`
estén agregadas a la publicación `supabase_realtime` en el servidor —
**confirmado 2026-07-19** contra la BD real que no lo estaban (el script
`realtime-migration.sql` de este repo apuntaba al proyecto externo viejo);
se agregaron vía `supabase-migrations/07-realtime-inventario-2026-07-18.sql`
(carpeta hermana a los 3 repos).

## Otras utilidades expuestas

- **`resetCheckpoint()`** — olvida el checkpoint incremental sin tocar la
  cola local (los cambios sin subir se conservan). Usado por `store.init()`
  cuando detecta catálogo vacío.
- **`pullAll()`** — `resetCheckpoint()` + `run()`; usado por el botón manual
  de sincronización (clic en el pill de estado) en `app.js`.
- **`pushAll(items)`** — encola cada ítem como upsert de `products`; usado
  por el botón "Subir todo a la nube" de `resumen.js`.
- **`pendingCount()`** — tamaño de la cola local; alimenta el texto del pill
  de estado (`"N sin subir"`) en `app.js`.

## Mapeo de categorías cliente ↔ servidor

`sync.js` mantiene su propia tabla de traducción, independiente del
`CATS` de `helpers.js`:

```js
EN2ES = { water:'agua', beverage:'agua', food:'alimentos', hygiene:'higiene',
  baby:'bebes', pets:'mascotas', medicine:'medicina', tools:'herramientas',
  cleaning:'limpieza', clothes:'ropa', stationery:'papeleria', other:'otros' }
CATS  = ['agua','alimentos','higiene','bebes','mascotas','medicina',
  'herramientas','limpieza','ropa','papeleria','otros']
```

`catToType(cat)` sube al servidor el nombre en español si es válido, o
`'otros'`. `typeToCat(type)` al bajar acepta tanto el español directo como
las claves en inglés de `EN2ES` (sugiere que el `type` en el servidor pudo
haber tenido valores en inglés en algún momento, o que se tolera ambos por
compatibilidad). **Nota 2026-07-19**: `new_schema_archive.product_type` (el
proyecto compartido al que se cortó la conexión) ya tiene sus 12 valores en
español desde antes — confirmado por UCVAcopio (`06-esquema-base-datos.md`
de ese repo, "renombra los 12 valores del enum `product_type` a español"),
así que `CATS` de este archivo debería mapear 1:1 sin necesitar las claves
en inglés de `EN2ES` para el tráfico contra el proyecto nuevo — no se
verificó valor por valor contra el enum real como parte de este corte
(fuera de alcance), pero la incertidumbre que motivaba esta nota (¿el
servidor manda inglés alguna vez?) es bastante menor ahora que antes.
