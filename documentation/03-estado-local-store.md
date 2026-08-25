# 3. Estado local y almacenamiento (`store.js`, `db.js`, `helpers.js`, `seed.js`)

## `js/db.js` — wrapper de IndexedDB

Base de datos local `ucv-inventario` (nombre interno heredado, sin efecto
visible — ver [01-vision-general.md](./01-vision-general.md)), versión `4`,
con 4 *object stores*, todos con `keyPath: 'id'`:

| Store | Contenido |
|---|---|
| `conteo` | Un registro por insumo del catálogo (cantidad, categoría, si está contado, etc). |
| `log` | Bitácora append-only: un registro por operación de conteo (delta aplicado, quién, cuándo, si fue borrado). |
| `checkpoints` | Snapshots completos del estado (`conteo` + `log`) para respaldo/restauración. |
| `queue` | Cola de operaciones pendientes de subir a Supabase (offline-first). |

API expuesta (`export const db = {...}`), basada en Promises sobre la
IndexedDB nativa (sin librerías):

- **conteo**: `getAll()`, `get(id)`, `put(rec)`, `del(id)`, `bulkPut(recs)`
  (una sola transacción), `count()`, `clear()`.
- **log**: `logGetAll()`, `logGet(id)`, `logPut(rec)`, `logClear()`,
  `logBulk(recs)`.
- **checkpoints**: `cpGetAll()`, `cpPut(rec)`, `cpDel(id)`.
- **queue**: `qGetAll()`, `qPut(rec)`, `qDel(id)`, `qBulkDel(ids)`,
  `qClear()`.

No hay índices secundarios — todo se filtra/agrupa en memoria en JS después
de `getAll()`, decisión razonable de simplicidad para el volumen esperado
de un catálogo por organización.

## `js/helpers.js` — utilidades puras

- **`escHtml(s)`** — escapa HTML para interpolación segura en templates de
  string (previene XSS al insertar nombres de insumos/usuarios en el DOM).
- **`normSearch(s)`** — normaliza texto para búsqueda: minúsculas, sin
  tildes, sin puntuación.
- **`nowISO()`**, **`timeAgo()`**, **`uid()`** (id corto), **`localDate(d)`**
  (fecha `YYYY-MM-DD` en huso local, para agrupar por día sin corrimiento
  UTC).
- **Categorías — 100% dinámicas, sin lista fija de la organización.** Ya no
  existe un catálogo hardcodeado de categorías (herencia visual de
  AcopioUCV, no de datos): `setCategories(list)` (llamado por
  `store.loadCategories()` tras `GET rest/v1/categories`) puebla un `Map`
  interno; `allCategories()` lo expone como array. `catLabel(id)` resuelve
  el nombre real o `'Sin categoría'`. `catColor(id)` asigna un color
  determinístico de una paleta fija de 13 tonos (`id % 13` — coincidencia
  de tamaño con el número de colores, no con el número de categorías).
  `catIcon()` ya no toma argumento: un solo ícono SVG genérico para
  cualquier categoría, porque cada organización crea las suyas libremente
  (no tiene sentido un set de íconos hecho a mano por categoría fija).
- **`iStatus(item)`** — estado visual (`'none'`/`'critico'`/`'bajo'`/`'ok'`)
  a partir de `cantidad` vs. `umbral`. **`iPct(item)`** — porcentaje de
  llenado para la barra de progreso de cada tarjeta.

## `js/seed.js` — catálogo semilla

`export const CATALOGO = [];` — **vacío a propósito**. GBSInventario es una
plantilla reutilizable: ya no trae precargado el catálogo de un centro de
acopio específico. `store.init()` sigue corriendo su lógica de siembra
contra este array en cada arranque; simplemente no siembra nada mientras
quede vacío. Cada organización arma su catálogo desde cero (vía Ingreso
Rápido o el Excel de importación masiva, ver
[04-vistas-ui.md](./04-vistas-ui.md#viewsingresorapidojs)).

## `js/store.js` — estado central + lógica de negocio

Único módulo con estado mutable en memoria compartido por toda la app:
`store.items`, `store.logs` (bitácora), `store.categories` (`[{id,
nombre}]`), `store.grupos`, `store.contadorNombre`, `store.communications`.

**Productos multigrupo (revisión 2026-08-25):** el catálogo (`categories`/
`products`) es compartido entre grupos de extensión — una categoría puede
estar vinculada a varios grupos (`category_grupos`, ver
[08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md)) y un
producto (nombre+unidad únicos por categoría) es una única fila reutilizada
por todos los grupos que lo cuenten. Lo que varía por grupo es el CONTEO
(`inventory`), así que `store.items` pasa a tener **una fila por (producto,
grupo)**, no una por producto:

- `item.id` — clave local **compuesta**: `` `${productClientId}::${grupoId}` ``
  (ver `_localId()`). Nunca asumir que es el `client_id` real del producto.
- `item.productClientId` — `client_id` real del producto (server), estable
  entre grupos — es lo que hay que mandar a `apply_count`/
  `add_product_to_grupo`/etc.
- `item.grupoId` — a qué grupo pertenece ESTE conteo.
- `item.deleted_at` — ahora significa "este grupo quitó su conteo"
  (`inventory.deleted_at`), no "el producto fue borrado" (eso solo pasa vía
  `merge_product`, server-side, y ya no deja ninguna fila local del producto
  perdedor porque no le queda ningún `inventory` que la genere).
- `store.siblings(productClientId)` — todas las filas (de cualquier grupo
  visible) de un mismo producto; lo usa Insumos para el total agregado
  cuando un super_admin ve más de un grupo a la vez.

### `store.init()`

1. Carga `contadorNombre` desde `localStorage`.
2. `loadCategories()` + `loadAllCategoryNames()` (catálogo global de
   nombres, para el buscador de crear categoría) si sync está habilitado;
   `loadGrupos()` además si es super_admin.
3. Filtra el seed (`CATALOGO`, vacío) contra las lápidas de `sync.js`.
4. Si IndexedDB está vacía: siembra (no hay nada que sembrar hoy) y marca
   `desdeCero = true`.
5. Si `sync.enabled`: si `desdeCero`, `sync.resetCheckpoint()`; luego
   `sync.run()` y recarga `items`/`logs` desde IndexedDB.

### Categorías — catálogo compartido, busca-y-reutiliza

- `loadCategories()` — categorías vinculadas al grupo activo (o el catálogo
  global completo si un super_admin no eligió un grupo puntual, ver
  `categoriesForGrupo(grupoId)`).
- `loadAllCategoryNames()`/`searchCategoryNames(query)` — catálogo GLOBAL de
  nombres (cualquier grupo), para sugerir reutilizar una categoría ya
  existente en vez de duplicarla al crear una nueva.
- `createCategory(nombre, grupoId)` → RPC `create_category` — busca por
  nombre (case-insensitive) y reutiliza si existe; si no, crea y vincula al
  grupo.
- `renameCategory(id, nombre)` → RPC `update_category` (afecta a TODOS los
  grupos que la usan — es la misma categoría compartida).
- `deleteCategory(id, {force, grupoId})` → RPC `delete_category` —
  desvincula la categoría de ESE grupo (bloquea si quedan conteos vivos de
  esa categoría en ese grupo, salvo `force: true`); solo borra la categoría
  real si queda sin ningún grupo vinculado. Ver
  [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md).

### Operaciones de negocio sobre insumos

Todas persisten en IndexedDB de inmediato y encolan en `sync.js` si
corresponde (offline-first: la UI nunca espera a la red).

- **`registrar(itemId, delta, opts)`** — suma un delta (piso en 0), marca
  el ítem como contado, actualiza `contado_por`/`updated_at`, y si el
  delta aplicado es distinto de cero (o `opts.forceLog`) crea una entrada
  de bitácora. `opts.origen` es `'conteo'` (por defecto, ajustes de
  Insumos) o `'ingreso'` (Ingreso Rápido) — determina el tipo mostrado en
  Historial.
- **`setTotal(itemId, total, opts)`** — fija el total exacto: calcula la
  diferencia contra la cantidad actual y delega en `registrar`.
- **`addNuevo({nombre, categoria, unidad, umbral, umbralMax, cantidad})`** —
  agrega un insumo a MI grupo (`writeGrupoId()`): busca/crea localmente por
  nombre normalizado y encola `'addproduct'` → RPC `add_product_to_grupo`,
  que busca-y-reutiliza el producto real (mismo nombre+unidad en esa
  categoría, usado por otro grupo) antes de crear uno nuevo — evita
  duplicar catálogo entre grupos.
- **`deleteInsumo(id)`** — borrado lógico del CONTEO de mi grupo (encola
  `'removeproduct'` → RPC `remove_product_from_grupo`); el producto sigue
  disponible para cualquier otro grupo que lo cuente. Revivir = volver a
  agregarlo (`addNuevo`).
- **`renombrarInsumo(id, nombre)`**, **`setUmbral(id, umbral, umbralMax)`**
  — el producto es compartido: el cambio se refleja en TODAS las filas
  locales que compartan `productClientId` (otros grupos visibles).
- **`fusionarInsumo(sourceId, targetId)`** — suma la cantidad de origen al
  destino, borra lógicamente el origen, encola una operación `'merge'`
  (RPC `merge_product`, reatribuye TODO el historial y fusiona el conteo de
  cada grupo — suma si el destino ya tiene fila para ese grupo, repunta si
  no — al destino).
- **`deleteLog(logId, fallback)`** — corrige/borra un registro de
  bitácora: revierte el efecto sobre `item.cantidad`, intenta borrar el
  movimiento en la nube (directo si hay red, encolado si no).
- **`resetItem(id)`** — deshace todo el conteo de un insumo (logs, cantidad
  a 0, `uncount_item` del lado del servidor).
- **`activeLogs()`**, **`stats()`**, **`statsByCat()`**, **`statsByGrupo()`**,
  **`grouped()`**, **`csv()`** — métricas/agrupaciones derivadas, todas
  sobre `visibleItems()`. `statsByGrupo()` es nuevo (Resumen: unidades
  totales por grupo, solo relevante cuando la vista mezcla más de uno).
- **`visibleItems()`** — filtro central de RBAC de datos: un coordinador de
  área ve solo `items` cuya `categoria` coincide con `auth.area()`; admin y
  el coordinador de área `general` ven todo su grupo; un super_admin sin
  grupo elegido ve TODOS los grupos a la vez (una fila por conteo). Ver
  [05-autenticacion.md](./05-autenticacion.md).
- **`setProductCategory(itemId, categoryId)`** → RPC
  `update_product_category` (admin-only del lado del servidor) — se
  refleja en todas las filas locales del mismo producto.
- **`countActiveUsers()`** → RPC `count_active_users` (para la pill de
  Resumen).
- **`writeGrupoId()`** — grupo efectivo para una escritura: el propio
  (admin/coordinador) o el elegido en la barra superior (super_admin; `null`
  si eligió "Todos" — no alcanza para escribir).

### Comunicados

`store.communications` (array), `store.activeCommunications` (getter,
filtra `.activo`). `loadCommunications()` (`GET rest/v1/comms`) y
`saveCommunication(data)` (`POST .../comms?on_conflict=id`, upsert) — sin
cola ni caché local: online-only, cualquier sesión autenticada puede leer/
escribir (RLS abierta, sin filtro de área).

### Notas de diseño relevantes

- El estado en memoria es la fuente de verdad para el render; IndexedDB es
  la persistencia; Supabase es la sincronización entre dispositivos. Los
  tres se mantienen en sync manual (no hay ORM/observer automático).
- Todas las mutaciones offline-first son *optimistic*: se aplican
  localmente antes de saber si la subida tuvo éxito. La reconciliación
  ocurre en el próximo `pull` de `sync.js`.
