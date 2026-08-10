// ── IndexedDB · almacenamiento local ──────────────────────
// Dos stores:
//   conteo → un registro por insumo del catálogo (cantidad contada + estado)
//   log    → bitácora append-only de cada registro de conteo (para historial/corrección)

const DB_NAME = 'ucv-inventario';
const DB_VER  = 4;
const STORES  = ['conteo', 'log', 'checkpoints', 'queue'];

let _db = null;

function _open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const d = req.result;
      for (const s of STORES) {
        if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

function _store(name, mode) {
  return _open().then(d => d.transaction(name, mode).objectStore(name));
}

function _all(name) {
  return _store(name, 'readonly').then(store => new Promise((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror   = () => rej(r.error);
  }));
}
function _get(name, id) {
  return _store(name, 'readonly').then(store => new Promise((res, rej) => {
    const r = store.get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror   = () => rej(r.error);
  }));
}
function _put(name, rec) {
  return _store(name, 'readwrite').then(store => new Promise((res, rej) => {
    const r = store.put(rec);
    r.onsuccess = () => res(rec);
    r.onerror   = () => rej(r.error);
  }));
}
function _bulk(name, recs) {
  // Dispara todos los put en una sola transacción y espera oncomplete
  // (mucho más rápido que encadenar onsuccess uno por uno).
  return _open().then(dbi => new Promise((res, rej) => {
    const tx = dbi.transaction(name, 'readwrite');
    const os = tx.objectStore(name);
    for (const r of recs) os.put(r);
    tx.oncomplete = () => res(recs.length);
    tx.onerror    = () => rej(tx.error);
    tx.onabort    = () => rej(tx.error);
  }));
}
function _del(name, id) {
  return _store(name, 'readwrite').then(store => new Promise((res, rej) => {
    const r = store.delete(id);
    r.onsuccess = () => res();
    r.onerror   = () => rej(r.error);
  }));
}
function _clear(name) {
  return _store(name, 'readwrite').then(store => new Promise((res, rej) => {
    const r = store.clear();
    r.onsuccess = () => res();
    r.onerror   = () => rej(r.error);
  }));
}

export const db = {
  // ── conteo (catálogo) ──
  getAll()      { return _all('conteo'); },
  get(id)       { return _get('conteo', id); },
  put(rec)      { return _put('conteo', rec); },
  del(id)       { return _del('conteo', id); },
  bulkPut(recs) { return _bulk('conteo', recs); },
  async count() {
    const store = await _store('conteo', 'readonly');
    return new Promise((res, rej) => {
      const r = store.count();
      r.onsuccess = () => res(r.result || 0);
      r.onerror   = () => rej(r.error);
    });
  },
  async clear() {
    const store = await _store('conteo', 'readwrite');
    return new Promise((res, rej) => {
      const r = store.clear();
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });
  },

  // ── log (bitácora) ──
  logGetAll()   { return _all('log'); },
  logGet(id)    { return _get('log', id); },
  logPut(rec)   { return _put('log', rec); },
  logClear()    { return _clear('log'); },
  logBulk(recs) { return _bulk('log', recs); },

  // ── checkpoints (respaldos) ──
  cpGetAll()    { return _all('checkpoints'); },
  cpPut(rec)    { return _put('checkpoints', rec); },
  cpDel(id)     { return _del('checkpoints', id); },
  // ── queue (cola de sincronización) ──
  qGetAll()     { return _all('queue'); },
  qPut(rec)     { return _put('queue', rec); },
  qDel(id)      { return _del('queue', id); },
  qBulkDel(ids) {
    return _open().then(dbi => new Promise((res, rej) => {
      const tx = dbi.transaction('queue', 'readwrite');
      const os = tx.objectStore('queue');
      for (const id of ids) os.delete(id);
      tx.oncomplete = () => res();
      tx.onerror    = () => rej(tx.error);
    }));
  },
  qClear() { return _clear('queue'); },
};
