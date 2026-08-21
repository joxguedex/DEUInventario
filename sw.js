// ── Service Worker · caché básico offline-first ───────────
const CACHE = 'gbs-inventario-v0.15';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
  './js/db.js',
  './js/sync.js',
  './js/auth.js',
  './js/checkpoints.js',
  './js/config.js',
  './js/env-config.js',
  './js/branding.js',
  './js/seed.js',
  './js/helpers.js',
  './js/errors.js',
  './js/views/conteo.js',
  './js/views/ingresorapido.js',
  './js/views/egresorapido.js',
  './js/views/despachos.js',
  './js/views/registro.js',
  './js/views/ingresos.js',
  './js/views/egresos.js',
  './js/views/resumen.js',
  './js/views/admin.js',
  './js/views/voluntarios.js',
  './js/views/grupos.js',
  './js/components/toast.js',
  './js/components/confirm.js',
  './icon.svg',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // No cachear llamadas a Supabase ni al CDN de fuentes/XLSX
  if (url.origin !== location.origin) return;

  // JS, HTML y CSS: red primero, caché como respaldo (siempre frescos).
  // cache:'reload' ignora el caché HTTP del navegador — sin esto, un
  // Cache-Control largo en /js o /css (ver vercel.json) hacía que este
  // "red primero" siguiera sirviendo la respuesta vieja sin darse cuenta.
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request, { cache: 'reload' }).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Resto (CSS, imágenes, etc.): caché primero
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        // Cache-on-fetch de recursos propios
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
