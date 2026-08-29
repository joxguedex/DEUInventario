// ── Estado central del inventario ─────────────────────────

import { db }                    from './db.js';
import { sync, tombstones }      from './sync.js';
import { auth }                  from './auth.js';
import { CATALOGO }       from './seed.js';
import { nowISO, uid, normSearch, catLabel, setCategories, allCategories } from './helpers.js';
import { SUPABASE_URL } from './config.js';
import { DB_SCHEMA } from './env-config.js';

const VIEWING_GRUPO_KEY = 'sibex-viewing-grupo';

function _commHeaders(extra = {}) {
  return auth.authHeaders({
    'Accept-Profile': DB_SCHEMA,
    'Content-Profile': DB_SCHEMA,
    ...extra,
  });
}

function _loadViewingGrupo() {
  try {
    const v = localStorage.getItem(VIEWING_GRUPO_KEY);
    return v ? Number(v) : null;
  } catch { return null; }
}

async function _rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: _commHeaders(), body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.hint || 'Error de servidor');
  return data;
}

// Etiqueta "Nombre · Área" (o "Nombre · Administrador") para atribuir cada
// movimiento a quien lo hizo, mismo formato que UCVAcopio (js/store.js#_actorNote
// allá) — comparten la misma tabla `movements`, así que la Bitácora ya sabe
// leer este patrón sin más cambios (ver registro.js). Los admin no tienen
// área asignada, por eso el caso especial.
function _conTag(nombre) {
  if (!nombre) return null;
  const area = auth.area();
  const tag = auth.isSuperAdmin() ? 'Super Administrador' : auth.isAdmin() ? 'Administrador' : (area ? catLabel(area) : null);
  return tag ? `${nombre} · ${tag}` : nombre;
}

// Clave local compuesta de un ítem — un producto (catálogo COMPARTIDO entre
// grupos, revisión "productos multigrupo" 2026-08-25) puede tener un conteo
// (inventory) por cada grupo que lo use, así que la clave local ya no puede
// ser solo el client_id del producto.
function _localId(productClientId, grupoId) {
  return `${productClientId}::${grupoId}`;
}

export const store = {
  items: [],          // catálogo con cantidad contada — 1 fila por (producto, grupo)
  logs: [],           // bitácora de registros de conteo (append-only)
  categories: [],      // [{id, nombre}] — categorías vinculadas al grupo activo (ver loadCategories)
  grupos: [],          // [{id, nombre}] — grupos de extensión, solo relevante para super_admin
  // Grupo que un super_admin eligió mirar (null = "Todos") — persistido para
  // sobrevivir un refresh. admin/coordinador nunca lo tocan: su alcance ya
  // viene fijo del servidor (RLS por auth.grupo()).
  viewingGrupoId: _loadViewingGrupo(),
  contadorNombre: '',
  _allCategoryNames: [],   // catálogo GLOBAL de nombres de categoría (cualquier grupo) — buscador de creación
  _catChangeListeners: [], // ver onCategoriesChanged()

  // Suscripción liviana para "el catálogo de categorías de mi grupo acaba
  // de cambiar" (hoy solo dispara createCategory()) — permite que
  // ingresorapido.js refresque su caché de "usados por otros grupos" sin
  // que conteo.js/admin.js tengan que importarlo directo (evita un import
  // circular con admin.js, que ingresorapido.js ya importa). Cableado
  // desde app.js#boot(), no acá.
  onCategoriesChanged(cb) { this._catChangeListeners.push(cb); },

  setViewingGrupo(id) {
    this.viewingGrupoId = id == null ? null : Number(id);
    try {
      if (this.viewingGrupoId == null) localStorage.removeItem(VIEWING_GRUPO_KEY);
      else localStorage.setItem(VIEWING_GRUPO_KEY, String(this.viewingGrupoId));
    } catch {}
  },

  // Grupo efectivo para una ESCRITURA (crear/contar/eliminar un insumo,
  // vincular una categoría): admin/coordinador siempre el suyo propio;
  // super_admin, el que eligió mirar en la barra superior (null = "Todos" —
  // no alcanza para escribir, hay que elegir uno puntual primero).
  writeGrupoId() {
    const g = auth.isSuperAdmin() ? this.viewingGrupoId : auth.grupo();
    return g == null ? null : Number(g);
  },

  async loadGrupos() {
    if (!navigator.onLine) return this.grupos;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/grupos?select=id,nombre&order=nombre.asc`, { headers: _commHeaders() });
      if (res.ok) this.grupos = await res.json();
    } catch { /* sin red: se queda con lo último cargado */ }
    return this.grupos;
  },
  async createGrupo(nombre) {
    const id = await _rpc('create_grupo', { p_nombre: nombre });
    await this.loadGrupos();
    return id;
  },
  async renameGrupo(id, nombre) {
    await _rpc('update_grupo', { p_id: id, p_nombre: nombre });
    await this.loadGrupos();
  },

  // ── Categorías — catálogo COMPARTIDO entre grupos (revisión "productos
  // multigrupo", 2026-08-25): una categoría ya no pertenece a un único
  // grupo, se vincula vía `category_grupos` (M2M). `item.categoria` sigue
  // guardando el `id` de la categoría — helpers.js#catLabel/catColor lo
  // resuelven contra el mapa que puebla setCategories() acá abajo. ────────

  // Categorías vinculadas a UN grupo puntual (usado por loadCategories() y
  // por el modal "Editar grupo" para listar/gestionar las de cualquier
  // grupo, no solo el propio).
  async categoriesForGrupo(grupoId) {
    if (!navigator.onLine || grupoId == null) return [];
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/category_grupos?select=categories(id,nombre)&grupo_id=eq.${grupoId}`,
        { headers: _commHeaders() }
      );
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map(r => r.categories).filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    } catch { return []; }
  },

  // Categorías "vigentes" para la sesión actual: super_admin sin grupo
  // elegido ("Todos") ve el catálogo completo; el resto (admin/coordinador,
  // o super_admin con un grupo puntual elegido) solo las vinculadas a ESE
  // grupo.
  async loadCategories() {
    if (!navigator.onLine) return this.categories;
    try {
      let rows;
      if (auth.isSuperAdmin() && this.viewingGrupoId == null) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,nombre&order=nombre.asc`, { headers: _commHeaders() });
        rows = res.ok ? await res.json() : this.categories;
      } else {
        const grupo = auth.isSuperAdmin() ? this.viewingGrupoId : auth.grupo();
        rows = await this.categoriesForGrupo(grupo);
      }
      this.categories = rows;
      setCategories(this.categories);
    } catch { /* sin red: se queda con lo último cargado (o vacío al inicio) */ }
    return this.categories;
  },

  // Catálogo GLOBAL de nombres de categoría (de cualquier grupo) — alimenta
  // el buscador de "crear categoría" (evita duplicados: reutilizar una ya
  // existente en vez de crear otra con el mismo nombre).
  async loadAllCategoryNames() {
    if (!navigator.onLine) return this._allCategoryNames;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,nombre&order=nombre.asc`, { headers: _commHeaders() });
      if (res.ok) this._allCategoryNames = await res.json();
    } catch {}
    return this._allCategoryNames;
  },
  // Sugerencias de categoría por texto (normSearch, mismo criterio que el
  // resto de los buscadores de la app) — hasta 8 resultados.
  searchCategoryNames(query) {
    const q = normSearch(query);
    const list = this._allCategoryNames || [];
    if (!q) return list.slice(0, 8);
    return list.filter(c => normSearch(c.nombre).includes(q)).slice(0, 8);
  },

  // Busca-y-reutiliza (o crea) una categoría y la vincula al grupo indicado
  // (o al efectivo de la sesión). Ver create_category en el esquema.
  async createCategory(nombre, grupoId) {
    const id = await _rpc('create_category', { p_nombre: nombre, p_grupo_id: grupoId ?? this.writeGrupoId() });
    await Promise.all([this.loadCategories(), this.loadAllCategoryNames()]);
    this._catChangeListeners.forEach(cb => cb());
    return id;
  },
  async renameCategory(id, nombre) {
    await _rpc('update_category', { p_id: id, p_nombre: nombre });
    await Promise.all([this.loadCategories(), this.loadAllCategoryNames()]);
  },
  // Desvincula la categoría del grupo (o la borra del todo si queda sin
  // ningún grupo vinculado) — force=true elimina también (borrado lógico)
  // los conteos vivos de ese grupo en esa categoría.
  async deleteCategory(id, { force = false, grupoId } = {}) {
    await _rpc('delete_category', { p_id: id, p_force: !!force, p_grupo_id: grupoId ?? this.writeGrupoId() });
    await this.loadCategories();
  },
  // "Usuarios activos" en Resumen — cuenta admin+coordinador no baneados
  // (ver count_active_users en supabase/new-project-schema.sql §8b y
  // manage-users#set_active para el baneo en sí).
  async countActiveUsers() {
    try { return await _rpc('count_active_users', {}); }
    catch { return null; }
  },
  // Admin-only del lado del servidor (ver update_product_category en el
  // esquema) — reasigna la categoría de un producto ya existente. Afecta a
  // TODOS los grupos que lo cuenten (el producto es catálogo compartido):
  // se refleja en cada fila local que comparta su productClientId.
  async setProductCategory(itemId, categoryId) {
    const it = this.find(itemId);
    if (!it || it.db_id == null) throw new Error('Insumo sin sincronizar todavía — espera a que suba antes de reasignar su categoría.');
    await _rpc('update_product_category', { p_product_id: it.db_id, p_category_id: categoryId });
    for (const i of this.items) {
      if (i.productClientId === it.productClientId) {
        i.categoria = categoryId;
        i.updated_at = nowISO();
        await db.put(i);
      }
    }
    return it;
  },

  // ── Carga inicial ───────────────────────────────────────
  async init() {
    this.contadorNombre = localStorage.getItem('ucv-inv-contador') || '';
    if (sync.enabled) await this.loadCategories();
    if (sync.enabled) await this.loadAllCategoryNames();
    if (sync.enabled && auth.isSuperAdmin()) await this.loadGrupos();

    // Un insumo fusionado en la nube no debe volver a sembrarse desde seed.js.
    const muertos = tombstones();
    const semilla = CATALOGO.filter(c => !muertos.has(c.id));

    let local = await db.getAll();
    let desdeCero = false;
    if (local.length === 0) {
      // IndexedDB vacío: o es la primera vez, o el navegador desalojó el
      // almacenamiento (frecuente en móvil). localStorage sobrevive a ese
      // desalojo, así que el checkpoint del pull incremental sigue apuntando
      // al futuro y NO traería los insumos ya contados: el catálogo se
      // quedaría en cero para siempre. Hay que olvidar el checkpoint.
      desdeCero = true;
      const grupoSemilla = this.writeGrupoId();
      const seeded = grupoSemilla == null ? [] : semilla.map(c => ({
        ...c, id: _localId(c.id, grupoSemilla), productClientId: c.id, grupoId: grupoSemilla,
        cantidad: 0, contado: false, contado_por: null, updated_at: nowISO(),
      }));
      if (seeded.length) await db.bulkPut(seeded);
      local = seeded;
    }
    this.items = local;
    this.logs  = await db.logGetAll();

    if (sync.enabled) {
      if (desdeCero) sync.resetCheckpoint();   // catálogo recién sembrado → pull completo
      try { await sync.run(); this.items = await db.getAll(); this.logs = await db.logGetAll(); }
      catch (e) { console.error('sync inicial', e); }
    }
    return this.items;
  },

  setContador(nombre) {
    this.contadorNombre = (nombre || '').trim();
    localStorage.setItem('ucv-inv-contador', this.contadorNombre);
  },

  find(id) { return this.items.find(i => i.id === id); },

  // Todas las filas (de cualquier grupo visible) de un mismo producto —
  // usado para el total agregado en Insumos cuando se ven varios grupos a
  // la vez (ver views/conteo.js).
  siblings(productClientId) {
    return this.items.filter(i => i.productClientId === productClientId && !i.deleted_at);
  },

  // Ítems visibles para la sesión activa: un coordinador solo ve el catálogo
  // de su propia área (una categoría de insumos); admin ve el catálogo
  // completo de su grupo sin restricción. El coordinador del área "General"
  // (auth.isGeneral()) también ve el catálogo completo sin restricción,
  // igual que admin — no tiene ítems propios (no es una categoría real),
  // y administra el inventario de todas las demás áreas igual que admin
  // (ver auth.js#canEditInventory()). Un super_admin sin grupo elegido ve
  // TODOS los grupos a la vez (una fila por cada conteo, ver item.grupoId);
  // si eligió uno puntual en el switcher, se filtra acá del lado del cliente.
  visibleItems() {
    if (auth.isCoordinador() && !auth.isGeneral()) {
      const area = auth.area();   // id de categoría (string) — ver js/auth.js
      return this.items.filter(i => String(i.categoria) === String(area));
    }
    if (auth.isSuperAdmin() && this.viewingGrupoId != null) {
      return this.items.filter(i => i.grupoId === this.viewingGrupoId);
    }
    return this.items;
  },

  // ── Registrar un conteo (suma un delta y lo apunta en la bitácora) ──
  async registrar(itemId, delta, opts = {}) {
    const item = this.find(itemId);
    if (!item) return null;
    delta = Math.round(Number(delta) || 0);
    const nuevo = Math.max(0, item.cantidad + delta);
    const aplicado = nuevo - item.cantidad;   // delta real (por si se topa en 0)

    item.cantidad    = nuevo;
    item.contado     = true;
    item.contado_por = _conTag(this.contadorNombre) || item.contado_por || null;
    item.updated_at  = nowISO();
    item.dirty       = true;
    await db.put(item);

    if (aplicado !== 0 || opts.forceLog) {
      const entry = {
        id: uid(),
        item_id: item.id,
        product_client_id: item.productClientId,
        grupo_id: item.grupoId,
        nombre: item.nombre,
        categoria: item.categoria,
        unidad: item.unidad,
        cantidad: aplicado,          // delta aplicado (puede ser negativo = corrección)
        ts: nowISO(),
        contado_por: item.contado_por,
        // Quién disparó esto, no el signo del delta — determina el sufijo
        // del `note` server-side (Recepción/Conteo, ver apply_count en
        // supabase/new-project-schema.sql §9). 'conteo' por defecto: el
        // único otro origen es Ingreso Rápido, que siempre lo manda
        // explícito (ver ingresorapido.js).
        origen: opts.origen || 'conteo',
        deleted_at: null,
      };
      this.logs.push(entry);
      await db.logPut(entry);
      await sync.enqueue('conteo', entry);
    }
    return item;
  },

  // ── Fijar el total contado exacto (calcula el delta y lo registra) ──
  async setTotal(itemId, total, opts = {}) {
    const item = this.find(itemId);
    if (!item) return null;
    total = Math.max(0, Math.round(Number(total) || 0));
    const delta = total - item.cantidad;
    if (delta !== 0) return this.registrar(itemId, delta, opts);
    // delta 0: si aún no estaba contado, marcarlo (confirma el total actual, incl. 0)
    if (!item.contado) return this.registrar(itemId, 0, { ...opts, forceLog: true });
    return item;
  },

  // ── Crear un insumo nuevo para MI grupo (no estaba contado todavía) ─────
  // `categoria` es el id de una categoría existente (store.categories). Si
  // ya existe un producto con ese nombre (normalizado) EN ESTA CATEGORÍA
  // usado por otro grupo (sugerencia del buscador de ingresorapido.js), el
  // servidor lo reutiliza (add_product_to_grupo) en vez de crear uno nuevo
  // — evita duplicados de catálogo entre grupos.
  async addNuevo({ nombre, categoria, unidad = 'und', umbral = 0, umbralMax = null, cantidad = 0 }) {
    nombre = (nombre || '').trim();
    if (!nombre || categoria == null) return null;
    umbralMax = umbralMax == null ? null : (Math.max(0, Math.round(umbralMax) || 0) || null);
    cantidad = Math.max(0, Math.round(Number(cantidad) || 0));
    const grupoId = this.writeGrupoId();
    if (grupoId == null) throw new Error('Elegí un grupo de extensión en la barra superior primero.');

    // Ya contado en ESTE grupo (mismo nombre, todavía visible): actualiza y
    // suma en vez de duplicar localmente.
    let item = this.items.find(i => i.grupoId === grupoId && !i.deleted_at && normSearch(i.nombre) === normSearch(nombre));
    if (item) {
      item.categoria = categoria;
      item.unidad = unidad;
      item.umbral = Math.max(0, Math.round(umbral) || 0);
      item.umbral_max = umbralMax;
      item.updated_at = nowISO();
      await db.put(item);
      if (cantidad > 0) await this.registrar(item.id, cantidad, { origen: 'ingreso' });
      return item;
    }

    const productClientId = 'new-' + uid();
    const localId = _localId(productClientId, grupoId);
    const contadoPor = cantidad > 0 ? (_conTag(this.contadorNombre) || null) : null;
    item = {
      id: localId, productClientId, grupoId,
      nombre, categoria, unidad,
      umbral: Math.max(0, Math.round(umbral) || 0), umbral_max: umbralMax,
      cantidad, contado: cantidad > 0, contado_por: contadoPor,
      updated_at: nowISO(), nuevo: true,
    };
    this.items.push(item);
    await db.put(item);

    const opId = uid();
    await sync.enqueue('addproduct', {
      item_id: localId, product_client_id: productClientId, grupo_id: grupoId,
      name: nombre, unidad, category_id: categoria,
      umbral: item.umbral, umbral_max: umbralMax, qnty: cantidad, client_op_id: opId,
    });
    if (cantidad > 0) {
      const entry = {
        id: opId, item_id: localId, product_client_id: productClientId, grupo_id: grupoId,
        nombre, categoria, unidad, cantidad, ts: nowISO(),
        contado_por: contadoPor, origen: 'ingreso', deleted_at: null,
      };
      this.logs.push(entry);
      await db.logPut(entry);
    }
    return item;
  },

  // ── Quitar un insumo de MI grupo (borrado lógico del CONTEO, no del
  // producto real — sigue disponible para el resto de los grupos que lo
  // cuenten) ──
  async deleteInsumo(id) {
    const it = this.find(id);
    if (!it) return false;
    it.deleted_at = nowISO();
    it.updated_at = nowISO();
    await db.put(it);
    await sync.enqueue('removeproduct', {
      item_id: it.id, product_client_id: it.productClientId, grupo_id: it.grupoId,
    });
    return true;
  },

  // ── Renombrar un insumo (sin tocar stock/categoría) ─────
  // Producto COMPARTIDO: el nombre se actualiza en TODAS las filas locales
  // que compartan su productClientId (otros grupos que también lo cuenten).
  async renombrarInsumo(id, nuevoNombre) {
    const it = this.find(id);
    nuevoNombre = (nuevoNombre || '').trim();
    if (!it || !nuevoNombre) return null;
    for (const i of this.items) {
      if (i.productClientId === it.productClientId) {
        i.nombre = nuevoNombre;
        i.updated_at = nowISO();
        i.dirty = true;
        await db.put(i);
      }
    }
    await sync.enqueue('products', it);
    return it;
  },

  // ── Cambiar el umbral de alerta (mínimo y/o máximo) de un insumo ya
  // existente ── Distinto de crear (addNuevo, donde se define de una vez):
  // esto ajusta los umbrales de un insumo que ya está en el catálogo, desde
  // el modal "Editar insumo" de views/conteo.js. umbralMax null = "sin
  // límite superior" (mismo criterio que umbral=0 = "no necesario"). Mismo
  // criterio que renombrarInsumo: se refleja en todas las filas del mismo
  // producto compartido.
  async setUmbral(id, umbral, umbralMax = null) {
    const it = this.find(id);
    if (!it) return null;
    umbral = Math.max(0, Math.round(Number(umbral) || 0));
    umbralMax = umbralMax == null ? null : (Math.max(0, Math.round(Number(umbralMax) || 0)) || null);
    for (const i of this.items) {
      if (i.productClientId === it.productClientId) {
        i.umbral = umbral;
        i.umbral_max = umbralMax;
        i.updated_at = nowISO();
        i.dirty = true;
        await db.put(i);
      }
    }
    await sync.enqueue('products', it);
    return it;
  },

  // ── Fusionar un insumo duplicado en otro ya existente ───
  // Usado por "Renombrar" cuando, en vez de escribir un nombre nuevo, el
  // usuario elige un insumo que ya está en el catálogo: el stock de `sourceId`
  // se suma a `targetId` y `sourceId` se elimina (soft delete), para limpiar
  // duplicados/variantes mal escritas sin perder lo ya contado. Además se
  // encola un 'merge' para el RPC merge_product: sin eso, el HISTORIAL viejo
  // de `sourceId` (Bitácora/Resumen · Ingresos) se quedaría apuntando a esa
  // fila ya fusionada para siempre, en vez de aparecer bajo la identidad del
  // insumo destino — ver supabase/new-project-schema.sql §merge_product.
  async fusionarInsumo(sourceId, targetId) {
    const source = this.find(sourceId);
    const target = this.find(targetId);
    if (!source || !target || source.id === target.id) return null;
    await this.registrar(target.id, source.cantidad);
    await this.deleteInsumo(source.id);
    if (sync.enabled) await sync.enqueue('merge', {
      item_id: source.id,
      source_item_id: source.productClientId, target_item_id: target.productClientId,
    });
    return target;
  },

  // ── Borrar/corregir un registro de la bitácora ──────────
  // logId es el client_op_id del movimiento en la nube (la vista de bitácora
  // lo trae en cada fila). El RPC delete_count borra ESE movimiento y revierte
  // su efecto en el stock; sin eso, borrar solo agregaba una corrección y el
  // registro original nunca desaparecía.
  async deleteLog(logId, fallback = null) {
    let entry = this.logs.find(l => l.id === logId);
    if (!entry) {
      if (!fallback) return null;
      entry = {
        id: logId,
        item_id: fallback.item_id,
        nombre: fallback.nombre || '',
        categoria: fallback.categoria ?? null,
        unidad: fallback.unidad || 'und',
        cantidad: fallback.cantidad,
        ts: fallback.ts || nowISO(),
        contado_por: fallback.contado_por,
        deleted_at: null
      };
      this.logs.push(entry);
    }
    if (entry.deleted_at) return null;
    entry.deleted_at = nowISO();
    await db.logPut(entry);

    // Borrado real en la nube (idempotente): directo si hay red, si no a la cola.
    if (sync.enabled) {
      const ok = navigator.onLine && await sync.deleteCount(logId).catch(() => false);
      // item_id acompaña a la op para que el push sepa a qué insumo pertenece
      // y solo retenga las ops de ESE insumo si esta se queda atascada.
      if (!ok) await sync.enqueue('delcount', { client_op_id: logId, item_id: entry.item_id });
    }

    const item = this.find(entry.item_id);
    if (item) {
      item.cantidad = Math.max(0, item.cantidad - entry.cantidad);
      const quedan = this.logs.some(l => l.item_id === item.id && !l.deleted_at);
      item.contado = quedan;
      item.updated_at = nowISO();
      item.dirty = true;
      await db.put(item);
    }
    return item;
  },

  // ── Deshacer todo el conteo de un insumo (desmarcar) ────
  // El RPC uncount_item deja qnty=0 y last_counted_at=NULL en la nube, para
  // que el pull lo derive como NO contado. Antes se enviaban deltas negativos
  // vía apply_count, que volvía a sellar last_counted_at y el insumo reaparecía
  // marcado tras recargar.
  async resetItem(id) {
    const item = this.find(id);
    if (!item) return null;
    for (const l of this.logs) {
      if (l.item_id === id && !l.deleted_at) {
        l.deleted_at = nowISO();
        await db.logPut(l);
      }
    }
    item.cantidad = 0; item.contado = false; item.contado_por = null;
    item.updated_at = nowISO(); item.dirty = true;
    await db.put(item);
    if (sync.enabled) await sync.enqueue('uncount', {
      item_id: item.id, product_client_id: item.productClientId, grupo_id: item.grupoId,
    });
    return item;
  },

  activeLogs() { return this.logs.filter(l => !l.deleted_at); },

  // ── Métricas ────────────────────────────────────────────
  stats() {
    const active = this.visibleItems().filter(i => !i.deleted_at);
    const total = active.length;
    const contados = active.filter(i => i.contado).length;
    const unidades = active.reduce((s, i) => s + (i.contado ? i.cantidad : 0), 0);
    return { total, contados, pendientes: total - contados, unidades };
  },

  // Cada PRODUCTO cuenta una sola vez por categoría, nunca una vez por
  // grupo que lo tenga (fix 2026-08-30) — un catálogo compartido con el
  // mismo insumo en 3 grupos no son "3 insumos", es 1. "unidades" sí suma
  // entre grupos (el total real de stock de la categoría); "total"/
  // "contados" cuentan productos distintos. Para admin/coordinador
  // (visibleItems ya acotado a un solo grupo) el resultado es idéntico al
  // de antes — el cambio solo se nota con super_admin viendo "Todos los
  // grupos".
  statsByCat() {
    const porCategoria = {};
    for (const i of this.visibleItems()) {
      if (i.deleted_at) continue;
      const cat = (porCategoria[i.categoria] ||= new Map());
      const p = cat.get(i.productClientId) || { contado: false, unidades: 0 };
      p.contado = p.contado || i.contado;
      if (i.contado) p.unidades += i.cantidad;
      cat.set(i.productClientId, p);
    }
    const m = {};
    for (const [cat, productos] of Object.entries(porCategoria)) {
      const bucket = (m[cat] = { total: 0, contados: 0, unidades: 0 });
      for (const p of productos.values()) {
        bucket.total++;
        if (p.contado) { bucket.contados++; bucket.unidades += p.unidades; }
      }
    }
    return m;
  },

  // Total de unidades por grupo — solo tiene sentido cuando la vista actual
  // mezcla más de un grupo (super_admin sin uno elegido); Resumen lo muestra
  // junto al desglose por categoría (ver views/resumen.js).
  statsByGrupo() {
    const m = {};
    for (const i of this.visibleItems()) {
      if (i.deleted_at) continue;
      (m[i.grupoId] ||= { total: 0, contados: 0, unidades: 0 });
      m[i.grupoId].total++;
      if (i.contado) { m[i.grupoId].contados++; m[i.grupoId].unidades += i.cantidad; }
    }
    return m;
  },

  grouped() {
    const cat = {};
    for (const it of this.visibleItems()) {
      if (it.deleted_at) continue;
      if (!cat[it.categoria]) cat[it.categoria] = [];
      cat[it.categoria].push(it);
    }
    return cat;
  },

  csv() {
    const head = ['nombre', 'categoria', 'unidad', 'cantidad', 'contado_por'];
    return [head.join(','), ...this.visibleItems().filter(i => !i.deleted_at).map(i => [
      `"${i.nombre}"`, `"${catLabel(i.categoria)}"`, i.unidad, i.cantidad, `"${i.contado_por || ''}"`
    ].join(','))].join('\n');
  },

  // ── Comunicados (tabla compartida con UCVAcopio/UCVComandas, misma
  // new_schema_archive.comms) — pestaña puente entre los 3 sistemas
  // hermanos, agregada 2026-07-28. Online-only, sin caché/cola local, igual
  // que el resto de esta sección en UCVAcopio (nunca formó parte del motor
  // offline de conteo). ──────────────────────────────────────────────────
  communications: [],

  get activeCommunications() { return this.communications.filter(c => c.activo); },

  _validateCommunication(data) {
    if (!data.titulo?.trim()) throw new Error('El título es obligatorio');
    if (!data.cuerpo?.trim()) throw new Error('El mensaje es obligatorio');
  },

  // Separados por grupo de extensión (decisión explícita, ver RLS de
  // `comms` en supabase/new-project-schema.sql §11.3): admin/coordinador
  // reciben ya filtrado del servidor; un super_admin con un grupo elegido
  // en la barra superior agrega el filtro acá del lado del cliente (RLS le
  // dejaría ver todos, "Todos los grupos" los muestra sin filtrar).
  async loadCommunications() {
    if (!navigator.onLine) throw new Error('Offline');
    let url = `${SUPABASE_URL}/rest/v1/comms?select=*&order=created_at.desc`;
    if (auth.isSuperAdmin() && this.viewingGrupoId != null) url += `&grupo_id=eq.${this.viewingGrupoId}`;
    const res = await fetch(url, { headers: _commHeaders() });
    if (!res.ok) throw new Error(`No se pudieron cargar comunicados (${res.status})`);
    const rows = await res.json();
    this.communications = rows.map(r => ({
      id:       r.id.toString(),
      titulo:   r.titulo,
      cuerpo:   r.cuerpo,
      urgencia: r.urgencia,
      autor:    r.autor,
      activo:   r.activo,
      fecha:    r.created_at,
      grupoId:  r.grupo_id,
    }));
  },

  // Insert/update directo por REST (upsert por `id`) — el esquema nuevo ya
  // no tiene una RPC save_comunicado compartida con los sistemas hermanos;
  // `comms` tiene RLS con policy abierta a cualquier sesión autenticada
  // (ver supabase/new-project-schema.sql §11.3), no hace falta una RPC
  // SECURITY DEFINER solo para esto.
  async saveCommunication(data) {
    this._validateCommunication(data);
    if (!navigator.onLine) throw new Error('Offline');
    // grupo_id: obligatorio para crear uno nuevo (data.grupoId ausente) —
    // admin/coordinador siempre en el suyo, super_admin en el elegido en la
    // barra superior. Al ACTUALIZAR uno existente (p.ej. resolveComm), se
    // conserva el que ya traía la fila (nunca cambia de grupo).
    const grupoId = data.grupoId ?? this.writeGrupoId();
    if (grupoId == null) throw new Error('Elegí un grupo de extensión en la barra superior primero.');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/comms?on_conflict=id`, {
      method: 'POST',
      headers: _commHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
        id:       data.id || uid(),
        titulo:   data.titulo,
        cuerpo:   data.cuerpo,
        urgencia: data.urgencia,
        autor:    data.autor,
        activo:   data.activo,
        fecha:    data.fecha ?? Date.now(),
        grupo_id: grupoId,
      }),
    });

    if (!res.ok) throw new Error(`Error al publicar comunicado (${res.status})`);
    await this.loadCommunications();
  },
};
