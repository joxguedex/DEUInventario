// ── Checkpoints / auto-respaldo del conteo ────────────────
// Snapshots locales (IndexedDB) del estado del conteo, para no
// perder un inventario a medias. Se crea uno automático al abrir
// si el último tiene más de AUTO_HORAS, y se pueden crear/restaurar
// manualmente. Restaurar es una acción sensible (coordinador).

import { db }          from './db.js';
import { store }       from './store.js';
import { uid, nowISO } from './helpers.js';

const AUTO_HORAS = 6;     // frecuencia del auto-respaldo
const MAX_KEEP   = 12;    // retención (borra los más viejos)

export const checkpoints = {
  list: [],

  async load() {
    this.list = (await db.cpGetAll()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return this.list;
  },

  // Crea un snapshot del estado actual (items contados + bitácora)
  async create(creadoPor = 'auto') {
    const s = store.stats();
    const cp = {
      id: uid(),
      created_at: nowISO(),
      creado_por: creadoPor,
      resumen: { contados: s.contados, total: s.total, unidades: s.unidades },
      data: {
        items: store.items.map(i => ({
          id: i.id, nombre: i.nombre, categoria: i.categoria, unidad: i.unidad,
          umbral: i.umbral, umbral_max: i.umbral_max ?? null, cantidad: i.cantidad, contado: i.contado,
          contado_por: i.contado_por, updated_at: i.updated_at, nuevo: i.nuevo || false,
        })),
        logs: store.logs,
      },
    };
    await db.cpPut(cp);
    await this.load();
    await this._prune();
    return cp;
  },

  // Auto-respaldo si el último es viejo (o no hay ninguno)
  async autoBackup() {
    await this.load();
    const last = this.list[0];
    const stale = !last || (Date.now() - new Date(last.created_at).getTime()) > AUTO_HORAS * 3600e3;
    // Solo respaldar si hay algo contado (no tiene sentido respaldar todo en 0)
    if (stale && store.stats().contados > 0) return this.create('auto');
    return null;
  },

  // Restaura un snapshot: sobrescribe items + bitácora locales
  async restore(id) {
    const cp = this.list.find(c => c.id === id);
    if (!cp) return false;
    // Reponer items (respetando el catálogo actual: actualiza los que existan)
    const byId = new Map(store.items.map(i => [i.id, i]));
    for (const snap of cp.data.items) {
      const cur = byId.get(snap.id) || {};
      byId.set(snap.id, { ...cur, ...snap, dirty: true });
    }
    store.items = [...byId.values()];
    await db.bulkPut(store.items);   // una sola transacción
    // Reponer bitácora
    await db.logClear();
    if (cp.data.logs?.length) await db.logBulk(cp.data.logs);
    store.logs = cp.data.logs ? [...cp.data.logs] : [];
    return true;
  },

  async remove(id) {
    await db.cpDel(id);
    await this.load();
  },

  async _prune() {
    if (this.list.length <= MAX_KEEP) return;
    const extra = this.list.slice(MAX_KEEP);
    for (const cp of extra) await db.cpDel(cp.id);
    await this.load();
  },
};
