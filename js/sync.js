// ── Sincronización con la BD unificada (Supabase) ─────────
// Patrón offline-first, replicación incremental y coalesce de deltas.
// ------------------------------------------------------------

import { SUPABASE_URL, SUPABASE_KEY, SYNC_ENABLED } from './config.js';
import { DB_SCHEMA } from './env-config.js';
import { db } from './db.js';
import { store } from './store.js';
import { auth, supabaseClient } from './auth.js';
import { uid } from './helpers.js';
import { explicarHTTP, explicarRed } from './errors.js';
import { toast } from './components/toast.js';

// Checkpoint del pull incremental: guarda un updated_at ISO del servidor.
//   v1 'ucv-inv-ls'  → guardaba epoch ms del reloj del cliente (desfase).
//   v2 'ucv-inv-ls2' → los dispositivos que perdieron IndexedDB quedaron con
//                      el checkpoint adelantado y el catálogo en cero.
//   v3 → nombre nuevo: cada dispositivo hace UN pull completo al actualizar
//        y a partir de ahí vuelve al pull incremental.
//   v4 → corte a new_schema_archive (proyecto Supabase compartido): los
//        client_id/updated_at de v3 pertenecen al proyecto externo viejo
//        (bwdipsshosclqoxbjbho), que ya no se usa — el checkpoint viejo
//        "convencería" al pull incremental de que ya trajo todo del
//        catálogo nuevo y no traería nada (ver 02-inventario.md §1).
//   v5 → reestructuración de categorías (2026-07-26/27, commit "Reestructurar
//        categorías..."): el enum product_type se recreó y TODOS los
//        productos se reclasificaron en una sola migración contra
//        producción, pero el checkpoint v4 de cada dispositivo ya podía
//        estar más adelante que el `updated_at` con el que esa migración
//        marcó las filas (o el dispositivo ya había hecho un pull parcial
//        justo alrededor de ese instante) — sin forzar un pull completo,
//        el `categoria` local se quedaba con la clave VIEJA (p.ej. "higiene",
//        "bebes", "agua", "otros", "ropa", "mascotas" — ninguna existe en las
//        13 nuevas), typeToCat() nunca la corregía (solo se re-evalúa cuando
//        el producto vuelve a bajar por el pull) y esos insumos caían en
//        "Sin categoría" — y, peor, un coordinador de esa área ya no veía
//        NADA porque store.visibleItems() compara contra la clave nueva.
//   v6 → productos multigrupo (2026-08-25): la clave local de un ítem pasa
//        de "client_id del producto" a "client_id::grupo_id" (un producto
//        ahora puede tener un conteo por cada grupo que lo use) — el
//        checkpoint viejo no tiene ningún sentido contra la forma nueva, ver
//        CUTOVER_MULTIGRUPO_KEY abajo (que además vacía todo lo demás).
const LS_KEY = 'ucv-inv-ls6';

// Lápidas: client_id de insumos borrados en la nube (fusión de duplicados).
// Hay que recordarlos porque store.init() re-siembra desde seed.js cualquier
// insumo ausente de IndexedDB; sin esto, un insumo fusionado resucita en cada
// arranque y se vuelve a subir.
// v2 → mismo corte de proyecto que LS_KEY: las lápidas de v1 referencian
// client_id del proyecto externo viejo, sin relación con el catálogo nuevo.
const TOMB_KEY = 'ucv-inv-tomb2';

// Corte a new_schema_archive (proyecto compartido): la cola de sync v3 pudo
// quedar con operaciones (conteos/creación de insumos) referenciando
// client_id del catálogo del proyecto EXTERNO viejo, que no existen en el
// catálogo nuevo — apply_count fallaría con "Producto no existe" para cada
// una. Se drena una sola vez al arrancar con el código nuevo (ver
// 02-inventario.md §1 "Reset de estado local de sync al cortar").
const CUTOVER_KEY = 'ucv-inv-cutover-new-schema-archive';
async function _drainQueueOnce() {
  if (localStorage.getItem(CUTOVER_KEY)) return;
  try { await db.qClear(); }
  finally { localStorage.setItem(CUTOVER_KEY, '1'); }
}

// Corte "productos multigrupo" (2026-08-25): la forma del ítem local cambió
// por completo (id compuesto, productClientId/grupoId nuevos) y las RPCs de
// conteo ganaron parámetros nuevos — cualquier fila de `conteo` u operación
// en `queue` de antes de este deploy queda irreconciliable con el esquema
// nuevo. Se vacían ambas UNA sola vez (nunca solo el checkpoint: sin esto,
// filas con el `id` viejo conviven para siempre junto a las nuevas y el
// catálogo se ve duplicado) y se fuerza un pull completo desde cero.
const CUTOVER_MULTIGRUPO_KEY = 'ucv-inv-cutover-multigrupo';
async function _drainMultigrupoOnce() {
  if (localStorage.getItem(CUTOVER_MULTIGRUPO_KEY)) return;
  try {
    await db.clear();
    await db.qClear();
    localStorage.removeItem(LS_KEY);
  } finally {
    localStorage.setItem(CUTOVER_MULTIGRUPO_KEY, '1');
  }
}

export function tombstones() {
  try { return new Set(JSON.parse(localStorage.getItem(TOMB_KEY)) || []); }
  catch { return new Set(); }
}
function addTombstone(clientId) {
  const t = tombstones();
  if (t.has(clientId)) return;
  t.add(clientId);
  localStorage.setItem(TOMB_KEY, JSON.stringify([...t]));
}

// El access_token real de la sesión (no solo la anon key) — auth.uid() del
// lado del servidor y las políticas RLS `to authenticated` de
// supabase/new-project-schema.sql dependen de esto. Accept-Profile/
// Content-Profile enrutan contra el esquema configurado (PostgREST usa el
// que aplica según el verbo; da igual mandar ambos siempre).
function _headers(extra = {}) {
  return auth.authHeaders({
    'Accept-Profile': DB_SCHEMA,
    'Content-Profile': DB_SCHEMA,
    ...extra,
  });
}

// ¿El error impide reintentar para siempre? 401/403 (permiso o sesión), 408/429
// (temporales) y 404 son recuperables: la operación se queda en la cola. El resto
// de los 4xx son datos inválidos y sí se descartan, para no atascar la cola.
//
// El 404 es recuperable a propósito: si un RPC todavía no está creado en la BD
// (migración pendiente), PostgREST responde 404 "Could not find the function".
// Descartarlo borraba en silencio la corrección del voluntario — la app decía
// "listo", la nube nunca se enteraba y el siguiente pull revivía el conteo viejo.
// Dejándolo en la cola, la corrección espera y sube sola al aplicar la migración.
function _isPermanent(status) {
  return status >= 400 && status < 500 && ![401, 403, 404, 408, 429].includes(status);
}

// Insumo al que apunta una operación de la cola (para no reordenar sus ops).
function _opItem(op) {
  // 'merge' no tiene item_id propio (fusiona dos insumos): se bloquea por el
  // insumo de ORIGEN si el RPC falla, igual criterio que el resto — sin esto,
  // caería en el bloqueoTotal global pensado solo para ops viejas sin item_id.
  return op.payload?.item_id || op.payload?.source_item_id || null;
}

// client_id del PRODUCTO (catálogo compartido) — ya no es item.id (que ahora
// es la clave local compuesta "client_id::grupo_id", ver store.js#_localId).
// deleted_at ya NO se manda acá: el borrado de un producto real solo ocurre
// server-side (merge_product) — "eliminar un insumo" del lado del cliente
// ahora es un borrado lógico de SU CONTEO (ver 'removeproduct' abajo), nunca
// del producto.
function productPayload(item) {
  return { client_id: item.productClientId, name: item.nombre, category_id: item.categoria,
    unidad: item.unidad || 'und', umbral: item.umbral || 0, umbral_max: item.umbral_max ?? null };
}

export const sync = {
  online: navigator.onLine,
  enabled: SYNC_ENABLED,
  isSyncing: false,
  // Último problema, ya traducido a lenguaje humano ({titulo, texto, grave}).
  // La app lo muestra en una banda fija: un toast se va a los 2 segundos y el
  // voluntario se queda sin saber si perdió su conteo o no.
  lastError: null,
  _listeners: [],
  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(); } catch {} }); },

  _fallo(status, cuerpo) { this.lastError = explicarHTTP(status, cuerpo); },
  _falloRed()            { this.lastError = explicarRed(); },
  _ok()                  { this.lastError = null; },
  
  // ── Cola Local ───────────────────────────────────────
  async enqueue(table, payload) {
    if (!SYNC_ENABLED) return;
    await db.qPut({ id: uid(), table, payload, ts: Date.now() });
    this.runDebounced();
  },

  // Agrupa múltiples llamadas para evitar colisiones
  runDebounced() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => this.run(), 500);
  },

  async run() {
    if (!SYNC_ENABLED) return;
    // Si ya hay un ciclo en vuelo, dejamos una marca para repetirlo al terminar:
    // así un aviso de Realtime que llega a mitad de un sync no se pierde.
    if (this.isSyncing) { this._rerun = true; return; }
    if (!navigator.onLine) {
      this.online = false; this._falloRed(); this._emit(); return;
    }

    this.isSyncing = true;
    this._rerun = false;
    // Cada ciclo arranca limpio: si algo vuelve a fallar, _push/_pull lo
    // vuelven a marcar. Así la banda de error desaparece sola al arreglarse.
    this._ok();
    try {
      await _drainQueueOnce();
      await _drainMultigrupoOnce();
      await this._push();
      await this._pull();
      this.online = true;
    } catch (err) {
      console.error("Sync run failed:", err);
      this.online = false;
      if (!this.lastError) this._falloRed();
    } finally {
      this.isSyncing = false;
      this._emit();
    }
    if (this._rerun) await this.run();
  },

  // ── PUSH (Subir Cambios Locales) ────────────────────
  async _push() {
    const q = await db.qGetAll();
    if (!q.length) return;

    // 1. Agrupar por tabla
    const byTable = { products: [] };
    for (const op of q) {
      if (byTable[op.table]) byTable[op.table].push(op);
    }

    const confirmedIds = [];

    // 2. Procesar tabla 'products' (absolutos, batch upsert)
    if (byTable.products.length > 0) {
      // Coalescing de absolutos por PRODUCTO (client_id) — última versión
      // gana; un rename/umbral se encola una vez por cada fila local que
      // comparta ese producto (una por grupo, ver store.js#renombrarInsumo),
      // así que sin esto se mandarían N upserts idénticos.
      const absMap = new Map();
      for (const op of byTable.products) absMap.set(op.payload.productClientId, op);
      
      const pids = Array.from(absMap.values());
      const batch = pids.map(op => productPayload(op.payload));

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=client_id`, {
          method: 'POST',
          headers: _headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          // Confirmar TODOS los opIds de productos (incluso los coalesced)
          for (const op of byTable.products) confirmedIds.push(op.id);
        } else if (_isPermanent(res.status)) {
          // Dato inválido: descartar para no atascar la cola
          const cuerpo = await res.text();
          console.error(`Error permanente productos (${res.status}):`, cuerpo);
          this._fallo(res.status, cuerpo);
          if (this.lastError) toast.err(this.lastError.texto, true);
          for (const op of byTable.products) confirmedIds.push(op.id);
        } else {
          // Recuperable (RLS, rate limit): se queda en la cola
          const cuerpo = await res.text();
          console.warn(`Push de productos aplazado (${res.status}):`, cuerpo);
          this._fallo(res.status, cuerpo);
          // Solo 401 (token inválido/vencido) es de verdad "la sesión murió" —
          // un 403 es un permiso/política RLS rechazando la operación con una
          // sesión perfectamente válida (ver el bug de create_inventory_row en
          // supabase/2026-08-10-fix-create-inventory-row-rls.sql: forzar el
          // cierre de sesión ahí era un efecto colateral engañoso, nada tenía
          // que ver con que la sesión hubiera vencido).
          if (res.status === 401) this._authFailed = true;
        }
      } catch (err) {
        this._falloRed();
        throw new Error("Network error during push products");
      }
    }

    // 3. Conteos y correcciones EN ORDEN CRONOLÓGICO (por ts).
    //    Sin coalescing: cada conteo usa su propio op.id como client_op_id
    //    (idempotente y estable). Así un 'uncount' encolado DESPUÉS de un
    //    conteo del mismo insumo no lo pisa por reordenamiento, y viceversa.
    //    'addproduct'/'removeproduct' (alta/baja del conteo de un insumo en
    //    MI grupo) entran en esta misma cola cronológica — no en el batch de
    //    'products' de arriba — para que un 'conteo' encolado justo después
    //    de crear el insumo espere a que exista de verdad del lado del
    //    servidor (ver store.js#addNuevo).
    const ops = q
      .filter(op => ['conteo', 'uncount', 'delcount', 'merge', 'addproduct', 'removeproduct'].includes(op.table))
      .sort((a, b) => a.ts - b.ts);

    // Insumos con una op atascada: sus ops POSTERIORES esperan (el orden
    // importa dentro de un mismo insumo). Antes se cortaba el bucle entero,
    // así que UNA corrección atascada congelaba la subida de TODOS los demás
    // conteos — justo lo que no puede pasar cuando hay voluntarios contando.
    const bloqueados = new Set();
    let bloqueoTotal = false;

    for (const op of ops) {
      const item = _opItem(op);
      // Op antigua sin item_id: no se puede saber a qué insumo pertenece, así
      // que a partir de ahí se conserva el orden global por seguridad.
      if (bloqueoTotal || (item && bloqueados.has(item))) continue;

      // Sin p_actor_ci/p_counted_by: el esquema nuevo (supabase/new-project-
      // schema.sql §9) resuelve el actor vía auth.uid() del lado del
      // servidor, nunca de un parámetro que manda el cliente — solo
      // funciona con una sesión real de Supabase Auth (ver nota de
      // store.js#_rpc), pendiente hasta la migración de auth.js.
      let endpoint, body;
      if (op.table === 'conteo') {
        const p = op.payload;
        const delta = p.deleted_at ? -p.cantidad : p.cantidad;
        endpoint = 'apply_count';
        body = { p_client_op_id: op.id, p_product_client_id: p.product_client_id, p_delta: delta, p_origen: p.origen || 'conteo', p_grupo_id: p.grupo_id };
      } else if (op.table === 'uncount') {
        endpoint = 'uncount_item';
        body = { p_product_client_id: op.payload.product_client_id, p_grupo_id: op.payload.grupo_id };
      } else if (op.table === 'merge') {
        // Reatribuye el historial del insumo absorbido (Renombrar → fusionar
        // con uno existente) al destino — ver supabase/new-project-
        // schema.sql §merge_product. Idempotente: un reintento no rompe nada
        // aunque el origen ya haya quedado fusionado.
        endpoint = 'merge_product';
        body = { p_source_client_id: op.payload.source_item_id,
                 p_target_client_id: op.payload.target_item_id };
      } else if (op.table === 'addproduct') {
        // Busca-y-reutiliza (o crea) el producto en la categoría y adjunta/
        // revive el conteo de MI grupo — ver store.js#addNuevo.
        const p = op.payload;
        endpoint = 'add_product_to_grupo';
        body = {
          p_client_id: p.product_client_id, p_name: p.name, p_unidad: p.unidad,
          p_category_id: p.category_id, p_umbral: p.umbral, p_umbral_max: p.umbral_max ?? null,
          p_qnty: p.qnty, p_client_op_id: p.client_op_id, p_grupo_id: p.grupo_id,
        };
      } else if (op.table === 'removeproduct') {
        endpoint = 'remove_product_from_grupo';
        body = { p_product_client_id: op.payload.product_client_id, p_grupo_id: op.payload.grupo_id };
      } else { // delcount
        endpoint = 'delete_count';
        body = { p_client_op_id: op.payload.client_op_id };
      }

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${endpoint}`, {
          method: 'POST', headers: _headers(), body: JSON.stringify(body),
        });
        if (res.ok) {
          confirmedIds.push(op.id);
          // add_product_to_grupo puede reutilizar un producto YA EXISTENTE
          // (mismo nombre+unidad en la categoría, usado por otro grupo) en
          // vez del client_id temporal que generó store.js#addNuevo — si
          // difiere, la fila local temporal se descarta; el próximo _pull()
          // de este mismo ciclo trae la canónica (su inventory recién creado
          // queda con updated_at reciente, se detecta como cambio).
          if (op.table === 'addproduct') {
            const data = await res.json().catch(() => null);
            const row = Array.isArray(data) ? data[0] : data;
            if (row && row.client_id && row.client_id !== op.payload.product_client_id) {
              await db.del(op.payload.item_id);
            }
          }
        } else if (_isPermanent(res.status)) {
          const cuerpo = await res.text();
          console.error(`Error permanente ${op.table} (${res.status}):`, cuerpo);
          this._fallo(res.status, cuerpo);
          if (this.lastError) toast.err(this.lastError.texto, true);
          confirmedIds.push(op.id);   // descartar para desatascar
        } else {
          console.warn(`${op.table} aplazado (${res.status})`);
          this._fallo(res.status, '');
          if (res.status === 401) this._authFailed = true; // 403 no es "sesión muerta", ver nota arriba
          // Se queda en la cola. Solo se frena lo que viene DESPUÉS para este
          // mismo insumo; el resto de los conteos sigue subiendo con normalidad.
          if (item) bloqueados.add(item);
          else bloqueoTotal = true;
        }
      } catch (err) {
        throw err;   // sin red: reintentar en el próximo ciclo
      }
    }

    // 4. Limpiar confirmados de IndexedDB
    if (confirmedIds.length > 0) {
      await db.qBulkDel(confirmedIds);
    }
  },

  // Borrado directo de un registro de bitácora (coordinador en línea).
  // Devuelve true si la nube lo aplicó; deleteLog encola si falla.
  async deleteCount(clientOpId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_count`, {
      method: 'POST', headers: _headers(),
      body: JSON.stringify({ p_client_op_id: clientOpId }),
    });
    return res.ok;
  },

  // ── PULL (Descargar Cambios Remotos) ────────────────
  // Productos multigrupo (2026-08-25): un producto ahora puede tener VARIAS
  // filas de inventory (una por grupo) — el pull incremental pasa a ser dos
  // consultas en vez de una:
  //   (a) products cuyo PROPIO catálogo cambió (rename/umbral/categoría/
  //       alta) — trae TODAS sus filas de inventory vivas (to-many).
  //   (b) inventory que cambió SOLO (un conteo, sin tocar el producto) — con
  //       su producto embebido (to-one).
  // Ambas escriben en el mismo mapa local por clave compuesta, así que un
  // cambio que aparezca en las dos (p.ej. un insumo nuevo) no se duplica.
  async _fetchPage(url) {
    let all = [], from = 0; const limit = 1000;
    for (;;) {
      const res = await fetch(url, { headers: _headers({ Range: `${from}-${from + limit - 1}` }) });
      if (!res.ok) { this._fallo(res.status, await res.text()); throw new Error(`HTTP ${res.status} pull`); }
      const data = await res.json();
      if (!Array.isArray(data)) break;
      all = all.concat(data);
      if (data.length < limit) break;
      from += limit;
    }
    return all;
  },

  async _pull() {
    // Checkpoint. Guardamos el updated_at MÁS ALTO que nos devolvió el servidor,
    // nunca Date.now(): updated_at lo escribe Postgres con su propio reloj, y un
    // teléfono desfasado unos segundos se saltaría cambios ajenos para siempre.
    const fetchSince = localStorage.getItem(LS_KEY) || new Date(0).toISOString();
    const since = encodeURIComponent(fetchSince);

    const [remoteProducts, remoteInventory] = await Promise.all([
      this._fetchPage(`${SUPABASE_URL}/rest/v1/products?updated_at=gt.${since}&select=id,client_id,name,category_id,unidad,umbral,umbral_max,updated_at,deleted_at,inventory(product_id,grupo_id,qnty,last_counted_at,last_counted_by,updated_at,deleted_at)`),
      this._fetchPage(`${SUPABASE_URL}/rest/v1/inventory?updated_at=gt.${since}&select=product_id,grupo_id,qnty,last_counted_at,last_counted_by,updated_at,deleted_at,products(id,client_id,name,category_id,unidad,umbral,umbral_max,updated_at,deleted_at)`),
    ]);

    if (remoteProducts.length === 0 && remoteInventory.length === 0) return;

    // Insumos con cambios locales todavía en la cola. El pull NO los pisa: a un
    // voluntario contando sin señal se le borraría de la pantalla lo que acaba
    // de contar, porque la nube aún no lo sabe.
    const pendientes = new Set(
      (await db.qGetAll())
        // item_id/product_client_id cubren conteo/uncount/addproduct/
        // removeproduct/merge; productClientId cubre 'products' (payload =
        // el item completo, ver store.js#renombrarInsumo/setUmbral).
        .flatMap(op => [op.payload?.item_id, op.payload?.product_client_id, op.payload?.productClientId])
        .filter(Boolean)
    );

    const localAll = await db.getAll();
    const byId = new Map(localAll.map(i => [i.id, i]));
    const byKey = new Map();   // localId -> item a escribir
    let maxUpdated = fetchSince;

    const bump = (ts) => { if (ts && ts > maxUpdated) maxUpdated = ts; };

    const putRow = (p, inv) => {
      bump(p.updated_at);
      bump(inv.updated_at);
      const localId = `${p.client_id}::${inv.grupo_id}`;
      const local = byId.get(localId);
      const pendiente = pendientes.has(localId) || pendientes.has(p.client_id);

      if (inv.deleted_at) {
        // Conteo soft-borrado en este grupo (remove_product_from_grupo, o
        // un desvincular-categoría forzado) — se refleja como tal, no se
        // pisa si hay algo pendiente en la cola para esta fila.
        if (pendiente) return;
        byKey.set(localId, {
          ...(local || {
            productClientId: p.client_id, grupoId: inv.grupo_id,
            nombre: p.name, categoria: p.category_id, unidad: p.unidad || 'und',
            umbral: p.umbral || 0, umbral_max: p.umbral_max ?? null,
            cantidad: 0, contado: false, contado_por: null,
          }),
          id: localId, db_id: p.id,
          nombre: p.name, categoria: p.category_id,
          deleted_at: inv.deleted_at, updated_at: p.updated_at,
        });
        return;
      }

      const contadoRemoto = inv.qnty > 0 || !!inv.last_counted_at;
      // Sin nada pendiente, MANDA la nube. Antes se conservaba el `contado`
      // local cuando el servidor decía "no contado": al desmarcar un insumo en
      // un teléfono, los demás lo seguían mostrando marcado (en 0, pero
      // contado) y el progreso quedaba inflado. uncount_item pone qnty=0 y
      // last_counted_at=NULL justamente para que la retracción se propague.
      byKey.set(localId, {
        ...(local || {}),
        db_id: p.id,
        id: localId,
        productClientId: p.client_id,
        grupoId: inv.grupo_id,
        nombre: p.name,
        categoria: p.category_id,
        unidad: p.unidad || local?.unidad || 'und',
        umbral: p.umbral ?? (local?.umbral ?? 10),
        umbral_max: p.umbral_max ?? (local?.umbral_max ?? null),
        cantidad: pendiente ? (local?.cantidad ?? inv.qnty) : inv.qnty,
        contado:  pendiente ? (local?.contado ?? false) : contadoRemoto,
        contado_por: pendiente
          ? (local?.contado_por ?? null)
          : (inv.last_counted_by ?? (contadoRemoto ? (local?.contado_por ?? null) : null)),
        last_counted_at: inv.last_counted_at,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      });
    };

    for (const p of remoteProducts) {
      bump(p.updated_at);
      if (p.deleted_at) {
        // Producto real fusionado (merge_product) — ya no debería tener
        // filas de inventory vivas; se marca deleted_at en cada variante
        // local que exista para ese producto (una por grupo), y se apunta
        // en las lápidas (ver comentario de tombstones() más arriba).
        addTombstone(p.client_id);
        for (const local of localAll) {
          if (local.productClientId === p.client_id) {
            byKey.set(local.id, { ...local, deleted_at: p.deleted_at, updated_at: p.updated_at });
          }
        }
        continue;
      }
      const rows = Array.isArray(p.inventory) ? p.inventory : (p.inventory ? [p.inventory] : []);
      for (const inv of rows) putRow(p, inv);
    }

    for (const row of remoteInventory) {
      if (row.products) putRow(row.products, row);
    }

    if (byKey.size > 0) {
      await db.bulkPut([...byKey.values()]);
    }

    // Avanzar el checkpoint solo hasta donde el servidor confirmó
    localStorage.setItem(LS_KEY, maxUpdated);
  },

  // ── HERRAMIENTAS ADICIONALES ────────────────────────

  // Foto COMPLETA de las cantidades en la nube, sin tocar el checkpoint
  // incremental ni escribir en IndexedDB. La usa la revisión de conteo para
  // comparar "lo que yo tengo" contra "lo que hay allá" antes de subir nada.
  // Devuelve Map(client_id → { qnty, contado }) — qnty SUMADA entre todos
  // los grupos que cuenten ese producto (catálogo compartido).
  async fetchCloudState() {
    const mapa = new Map();
    let from = 0; const limit = 1000;
    for (;;) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?deleted_at=is.null&select=client_id,inventory(qnty,last_counted_at,deleted_at)&order=id.asc`,
        { headers: _headers({ Range: `${from}-${from + limit - 1}` }) }
      );
      if (!res.ok) { this._fallo(res.status, await res.text()); throw new Error(`HTTP ${res.status}`); }
      const data = await res.json();
      if (!Array.isArray(data)) break;
      for (const p of data) {
        const rows = (Array.isArray(p.inventory) ? p.inventory : (p.inventory ? [p.inventory] : []))
          .filter(i => !i.deleted_at);
        const qnty = rows.reduce((s, i) => s + (i.qnty || 0), 0);
        const contado = rows.some(i => i.qnty > 0 || !!i.last_counted_at);
        mapa.set(p.client_id, { qnty, contado });
      }
      if (data.length < limit) break;
      from += limit;
    }
    this._ok();
    return mapa;
  },

  // Olvida el checkpoint: el próximo pull se trae el catálogo completo.
  // No toca la cola, así que los cambios locales sin subir se conservan.
  resetCheckpoint() { localStorage.removeItem(LS_KEY); },

  async pullAll() {
    this.resetCheckpoint();
    await this.run();
  },

  async pushAll(items) {
    if (!SYNC_ENABLED) return false;
    for (const item of items) await this.enqueue('products', item);
    return true;
  },

  // Inicializa el WebSocket. Requiere que 'inventory' y 'products' estén en la
  // publicación supabase_realtime (ver supabase/realtime-migration.sql).
  // Reusa el cliente compartido de auth.js — no crea uno propio (evitar dos
  // GoTrue gestionando la misma sesión por separado).
  listenRealtime() {
    if (!supabaseClient || !SYNC_ENABLED) return;
    if (this._realtimeChannel) return;

    const chan = supabaseClient.channel('db-changes');
    for (const table of ['inventory', 'products']) {
      chan.on('postgres_changes', { event: '*', schema: DB_SCHEMA, table },
        () => this.runDebounced());   // señal de invalidación → ciclo offline-first
    }

    chan.subscribe(status => {
      console.log('Realtime:', status);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        this.stopRealtime();
        const wait = Math.min(30_000, 1000 * 2 ** (this._rtRetries = (this._rtRetries || 0) + 1));
        setTimeout(() => this.listenRealtime(), wait);
      }
      if (status === 'SUBSCRIBED') this._rtRetries = 0;
    });

    this._realtimeChannel = chan;
  },

  stopRealtime() {
    if (!this._realtimeChannel) return;
    try { supabaseClient?.removeChannel(this._realtimeChannel); } catch {}
    this._realtimeChannel = null;
  },

  async pendingCount() {
    const q = await db.qGetAll();
    return q.length;
  },
};
