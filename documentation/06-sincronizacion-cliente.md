# 6. Sincronización con Supabase — lado cliente (`js/sync.js`)

## Patrón general: offline-first con cola local

`sync.js` no sincroniza en tiempo real por defecto para las mutaciones de
negocio — aplica un patrón de **cola local + reconciliación periódica**:

1. Toda mutación offline-first (`store.registrar`, `addNuevo`, `deleteLog`,
   `resetItem`, `renombrarInsumo`, `setUmbral`, `fusionarInsumo`,
   `deleteInsumo`) se aplica primero en memoria + IndexedDB, y **además**
   se encola (`sync.enqueue(table, payload)`) en el store `queue`.
2. `enqueue()` dispara `runDebounced()` — agrupa ráfagas de cambios en una
   sola corrida de sync 500ms después del último encolado.
3. `sync.run()`: `_drainQueueOnce()` → `_push()` (sube la cola) →
   `_pull()` (baja cambios remotos). Se re-dispara solo si llegó una señal
   de Realtime o un fallo de auth a mitad de ciclo.
4. Sin conexión (`navigator.onLine === false`), no intenta nada y solo
   marca `online = false`.
5. Disparadores adicionales de `run()`: evento `online`, `visibilitychange`
   a visible, y un `setInterval` cada 30s como red de seguridad (solo si
   `sync.enabled`).

**Egreso Rápido es la excepción deliberada a todo esto**: `create_comanda_rapida`
se llama directo vía `fetch`, sin pasar por `sync.enqueue` — genera un
documento de negocio irreversible con reserva de stock atómica en el
servidor, y no existe hoy un flujo de edición/anulación de comandas. Como
la RPC no pasa por la cola, `egresorapido.js` aplica un parche local manual
sobre `store.items` tras confirmar (decremento optimista + `contado=true`),
porque de lo contrario ese producto no reflejaría el nuevo stock en
Insumos hasta que algo más, ajeno a ese egreso, tocara su fila de
`products` y disparara un pull.

## Checkpoints de pull (`localStorage`)

El pull es **incremental**: guarda el `updated_at` más alto visto en la
última respuesta del servidor bajo una clave versionada
(`ucv-inv-ls5` a la fecha — el número de versión sube cada vez que un bug
de producción obliga a invalidar checkpoints viejos, p.ej. una
reclasificación masiva de categorías que dejaría dispositivos "convencidos"
de que ya tienen todo al día). En la siguiente corrida, solo pide filas con
`updated_at > checkpoint`. El checkpoint solo avanza hasta el
`updated_at` máximo de las filas **efectivamente aplicadas** en esa
corrida — si la paginación se corta a mitad, no se pierde el resto.

## Lápidas (`tombstones`, `localStorage`)

Guarda un set de `client_id` de insumos borrados/fusionados en la nube.
Necesario porque `store.init()` re-siembra desde `seed.js` cualquier ítem
del catálogo semilla que no encuentre en IndexedDB — sin esta lista, un
insumo fusionado/borrado "resucitaría" localmente en cada arranque (en la
práctica poco riesgo hoy, ya que `seed.js` está vacío — ver
[03-estado-local-store.md](./03-estado-local-store.md) — pero el mecanismo
sigue activo). `_pull()` alimenta esta lista cada vez que encuentra una
fila remota con `deleted_at` no nulo.

## `_drainQueueOnce()`

Vacía la cola local una sola vez, marcada por una clave de
`localStorage` — mecanismo pensado para cortes de proyecto (cambiar de
base de datos Supabase por completo): cualquier operación pendiente que
referencie un `client_id` que ya no existe en el catálogo actual se
perdería silenciosamente uno por uno con "Producto no existe"; en vez de
eso, se documenta la pérdida y se drena de una vez.

## `_push()` — subir la cola local

Agrupa la cola (`db.qGetAll()`) en dos grupos con estrategias distintas:

1. **`products`** (altas/ediciones de insumos) — **absolutas, con
   coalescing**: si hay varias operaciones encoladas para el mismo `id`,
   se queda solo con la última y las sube todas juntas en un único
   `POST rest/v1/products?on_conflict=client_id` (`Prefer:
   resolution=merge-duplicates,return=minimal`).
2. **`conteo` / `uncount` / `delcount` / `merge`** — **sin coalescing, en
   orden cronológico estricto**, porque son incrementales, no absolutas.
   Cada una llama a su propio RPC:
   - `conteo` → `apply_count` `{p_client_op_id, p_product_client_id,
     p_delta, p_origen}` — `client_op_id` es el `id` del log local, hace la
     operación idempotente.
   - `uncount` → `uncount_item` `{p_product_client_id}`.
   - `delcount` → `delete_count` `{p_client_op_id}`.
   - `merge` → `merge_product` `{p_source_client_id, p_target_client_id}`.

   Bloqueo por ítem (`_opItem()`): una operación atascada solo bloquea
   operaciones *posteriores del mismo ítem*, no toda la cola.

### Clasificación de errores HTTP (`_isPermanent`)

- **401** → marca `sync._authFailed = true` (la sesión murió de verdad;
  `app.js` cierra sesión y pide reautenticación). **403 no** — un rechazo
  de RLS no implica que la sesión esté muerta, se queda en la cola como
  recuperable.
- **408 / 429** → temporales, se reintentan tal cual.
- **404** → se mantiene en cola a propósito (por si una RPC todavía no
  desplegó del lado del servidor).
- Resto de 4xx → "dato inválido", se descartan de la cola para no
  atascarla indefinidamente.
- 5xx / errores de red → no permanentes, abortan `_push()` completo (la
  cola se conserva intacta).

## `_pull()` — bajar cambios remotos

```
GET /rest/v1/products
  ?updated_at=gt.{checkpoint}
  &select=id,client_id,name,category_id,unidad,umbral,updated_at,deleted_at,
          inventory(qnty,last_counted_at,last_counted_by)
```

Paginado vía header `Range` (bloques de 1000). Por cada fila remota: si
`deleted_at` no es nulo, borra el ítem local y lo agrega a las lápidas; si
no, upsert preservando campos locales que no vengan del servidor.
`contado` se deriva como `qnty > 0 || !!last_counted_at` — un conteo
confirmado en cero sigue contando como "contado" (distingue "no fui a
revisar" de "fui, miré, no había nada"). Ítems con operaciones pendientes en
la cola local **no** se sobrescriben con el pull (para no pisar un cambio
optimista todavía no confirmado).

- **`fetchCloudState()`** — snapshot completo sin tocar checkpoint/
  IndexedDB, para comparar local vs. nube antes de un push masivo.
- **`resetCheckpoint()`** / **`pullAll()`** — olvida el checkpoint (`run()`
  completo). Usado por `store.init()` cuando detecta catálogo vacío, y por
  el botón manual de sincronización (clic en el pill de estado).
- **`pushAll(items)`** — encola cada ítem como upsert de `products`.
- **`pendingCount()`** — tamaño de la cola, alimenta el texto del pill de
  estado.

## Realtime (`listenRealtime` / `stopRealtime`)

Reutiliza el `supabaseClient` de `auth.js` (nunca crea uno propio). Se
suscribe a un canal `'db-changes'` sobre `postgres_changes` (`event: '*'`)
de las tablas `inventory` y `products` en el schema `DB_SCHEMA`. Cualquier
evento simplemente dispara `runDebounced()` — no procesa el payload
directamente, actúa solo como señal de "hay algo nuevo, ve a buscarlo" y
delega la reconciliación real al ciclo normal de pull. Reconexión con
backoff exponencial (tope 30s) ante `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED`.
Requiere que `inventory`/`products` estén en la publicación
`supabase_realtime` del servidor (ver `supabase/realtime-migration.sql`).

## `sync.lastError` / `sync.onChange`

`lastError` = `{titulo, texto, grave}` (traducido por `errors.js` desde el
status HTTP o el tipo de error de red) — es lo que la UI muestra al
usuario cuando algo queda sin subir. `onChange(fn)` notifica a los
suscriptores tras cada `run()`; `app.js` lo usa para rehidratar
`store.items`/`store.logs` desde IndexedDB y repintar la vista activa.
