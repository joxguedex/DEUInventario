# 3. Estado local y almacenamiento (`store.js`, `db.js`, `helpers.js`, `seed.js`)

## `js/db.js` — wrapper de IndexedDB

Base de datos local `ucv-inventario` (versión `4`), con 4 *object stores*,
todos con `keyPath: 'id'`:

| Store | Contenido |
|---|---|
| `conteo` | Un registro por insumo del catálogo (el "documento" completo del ítem: cantidad, categoría, si está contado, etc). |
| `log` | Bitácora append-only: un registro por cada operación de conteo (delta aplicado, quién, cuándo, si fue borrado). |
| `checkpoints` | Snapshots completos del estado (`conteo` + `log`) para respaldo/restauración. |
| `queue` | Cola de operaciones pendientes de subir a Supabase (offline-first). |

API expuesta (`export const db = {...}`), todo basado en Promises sobre la
IndexedDB nativa (sin librerías):

- **`conteo`**: `getAll()`, `get(id)`, `put(rec)`, `del(id)`, `bulkPut(recs)`
  (una sola transacción, más rápido que puts individuales), `count()`,
  `clear()`.
- **`log`**: `logGetAll()`, `logGet(id)`, `logPut(rec)`, `logClear()`,
  `logBulk(recs)`.
- **`checkpoints`**: `cpGetAll()`, `cpPut(rec)`, `cpDel(id)`.
- **`queue`**: `qGetAll()`, `qPut(rec)`, `qDel(id)`, `qBulkDel(ids)`.

No hay índices secundarios — todo se filtra/agrupa en memoria en JS después
de `getAll()`, no vía cursores de IndexedDB. Para el volumen del catálogo
(~1700 ítems) es una decisión razonable de simplicidad sobre performance.

## `js/helpers.js` — utilidades puras

- **`escHtml(s)`** — escapa HTML para interpolación segura en templates de
  string (previene XSS al insertar nombres de insumos/usuarios en el DOM).
- **`normSearch(s)`** — normaliza texto para búsqueda: minúsculas, sin
  tildes (`normalize('NFD')` + strip de diacríticos), sin puntuación. Usado
  por el buscador de `conteo.js` y `quickadd.js`.
- `nombre` viaja tal cual entre el modelo local y `products.name` remoto —
  el peso/volumen que quiera aclararse va dentro del propio nombre (ej.
  `"Arroz 1 kg"`); no hay columna separada para eso (ver `unidad` más abajo,
  que es un campo distinto — la unidad de conteo, no la medida del producto).
- **`nowISO()`**, **`uid()`** (id aleatorio corto basado en timestamp +
  `crypto.getRandomValues`), **`localDate(d)`** (fecha `YYYY-MM-DD` en huso
  horario local, para agrupar la bitácora por día sin corrimiento UTC).
- **`CATS`** — catálogo de 13 categorías (reestructurado 2026-07-26, ya sin
  categoría catch-all: `alimentos_no_perecederos`, `alimentos`,
  `higiene_personal`, `snacks`, `alimentos_bebe`, `limpieza`,
  `panales_higiene_ninos`, `hidratacion`, `veterinaria`, `herramientas`,
  `ropa_descanso`, `medicina`, `papeleria`), cada una con icono SVG inline,
  etiqueta en español y color. Accesores: `catIcon(c)`, `catLabel(c)`,
  `catColor(c)` (con un fallback genérico "Sin categoría" si el valor no
  matchea ninguna de las 13).

## `js/seed.js` — catálogo semilla

Archivo generado (**no editar a mano**, según su propio comentario de
cabecera), de ~11 700 líneas. Exporta `CATALOGO`: un array plano de 1674
insumos, snapshot de AcopioUCV del 2026-07-06. Cada entrada:

```js
{ id: "seed0199", nombre: "Ac tranexamico 500mg/5ml", categoria: "medicina", unidad: "und", umbral: 10 }
```

- `id` conserva el identificador original de AcopioUCV (prefijo `seed` +
  número) para poder cruzar los conteos de vuelta con ese sistema.
- Todo arranca con cantidad implícita en `0` — `store.init()` es quien le
  agrega los campos de estado de conteo al sembrar.
- Si el catálogo de AcopioUCV cambia, este archivo se regenera consultando
  la tabla `items` de ese sistema (procedimiento fuera de este repo).

## `js/store.js` — estado central + lógica de negocio

Único módulo con estado mutable en memoria compartido por toda la app:
`store.items` (catálogo con estado de conteo) y `store.logs` (bitácora).

### `store.init()`

1. Carga `contadorNombre` desde `localStorage` (nombre del voluntario
   actual, usado para atribuir conteos).
2. Calcula `semilla` = `CATALOGO` menos las *lápidas* (`tombstones()` de
   `sync.js` — insumos que fueron fusionados/borrados en la nube y no deben
   resucitar).
3. Si IndexedDB está vacío (`local.length === 0`): siembra todo el catálogo
   con cantidad `0`, `contado:false`, y marca `desdeCero = true`. Esto cubre
   tanto la primera vez que se abre la app como el caso de que el navegador
   haya desalojado el storage (común en móvil) — en ese caso hace falta
   también resetear el checkpoint de sync para no perder insumos ya
   contados en otro dispositivo (`sync.resetCheckpoint()`).
4. Si ya había datos: solo agrega los insumos del seed que falten (altas
   nuevas del catálogo).
5. Si `sync.enabled`, corre `sync.run()` (push+pull) antes de devolver el
   estado.

### Operaciones de negocio

Todas persisten en IndexedDB de inmediato y encolan en `sync.js` si
corresponde (offline-first: la UI nunca espera a la red).

- **`registrar(itemId, delta, opts)`** — suma un delta a la cantidad actual
  (con piso en 0: si el delta llevaría a negativo, se recorta y se guarda el
  delta *realmente aplicado*). Marca el ítem como contado, actualiza
  `contado_por`/`updated_at`, y si el delta aplicado es distinto de cero (o
  `opts.forceLog`) crea una entrada de bitácora. Si el ítem es nuevo
  (`item.nuevo`), también encola su alta en `products`.
- **`setTotal(itemId, total)`** — fija el total exacto (no un delta):
  calcula la diferencia contra la cantidad actual y delega en `registrar`.
  Si el delta es 0 pero el ítem aún no estaba marcado, igual registra un
  log con `forceLog` (para poder distinguir "no fui a contar" de "conté y
  di cero").
- **`marcarCero(id)`** — atajo de `setTotal(id, 0)`.
- **`addNuevo({ nombre, categoria, unidad, umbral, cantidad })`** — crea un
  insumo fuera del catálogo semilla, con `id: 'new-' + uid()` y
  `nuevo: true`. Lo agrega a `store.items`, lo persiste, lo encola como alta
  en `products`, y si viene con cantidad inicial la registra.
- **`deleteLog(logId, fallback)`** — corrige/borra un registro de bitácora:
  marca `deleted_at` localmente, intenta borrar el movimiento
  correspondiente en la nube (RPC `delete_count`, directo si hay red; si no,
  a la cola como operación `delcount`), y revierte el efecto sobre
  `item.cantidad`. Si ya no quedan logs activos para ese ítem, lo desmarca
  como no contado.
- **`resetItem(id)`** — deshace *todo* el conteo de un insumo: borra
  (lógicamente) todos sus logs activos, pone `cantidad:0`, `contado:false`,
  y encola una operación `uncount` (RPC `uncount_item`) — distinto de enviar
  deltas negativos, porque eso limpia `last_counted_at` en el servidor (ver
  comentario en el propio código sobre por qué: si no, el ítem "reaparece"
  marcado tras recargar).
- **`activeLogs()`** — logs sin `deleted_at`.
- **`stats()` / `statsByCat()`** — métricas agregadas (total, contados,
  pendientes, unidades) usadas por las tarjetas de progreso en `conteo.js` y
  `resumen.js`.

### Notas de diseño relevantes

- El estado en memoria (`store.items`/`store.logs`) es la fuente de verdad
  para el render; IndexedDB es la persistencia, y Supabase es la
  sincronización entre dispositivos. Los tres se mantienen en sync manual
  (no hay un ORM/observer automático).
- Todas las mutaciones son *optimistic*: se aplican localmente antes de
  saber si la subida a la nube tuvo éxito. La reconciliación ocurre en el
  próximo `pull` de `sync.js`.
