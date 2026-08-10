# 1. Visión general

## Qué es

**Inventario UCV — Conteo Físico** es una PWA (Progressive Web App) en
JavaScript vanilla (sin framework, sin build step) para hacer un **inventario
físico real** de los insumos del centro de acopio de la UCV.

Es una app **independiente** de otro sistema hermano, **AcopioUCV**: nace
porque las cantidades en AcopioUCV están infladas (nunca se descontaron las
entregas realizadas). Esta app permite contar desde cero lo que **realmente
hay** en el almacén, y luego esos resultados se cargan de vuelta a AcopioUCV.

Comparten temática, catálogo de insumos y lenguaje visual, y — **desde el
2026-07-19** — también **base de datos**: como parte de la unificación de
acceso con AcopioUCV/UCVComandas, Inventario cortó conexión de su proyecto
Supabase externo propio hacia el proyecto compartido con esos 2 sistemas
(`fndrmxjykrtoddhstbyv`, esquema `new_schema_archive`) — ver
[05-autenticacion.md](./05-autenticacion.md) y
[08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md). El
despliegue (Vercel, rama `dev`) sigue siendo propio.

## Flujo de uso

1. **Catálogo precargado en 0.** 1674 insumos activos de AcopioUCV vienen
   incluidos en `js/seed.js`, agrupados por categoría, todos en cantidad `0`.
   Se conserva el `id` original de cada insumo (con prefijo `seedNNNN`) para
   poder cruzar los conteos con el sistema de acopio.
2. **Agregado rápido.** Panel persistente (barra lateral en desktop, hoja
   inferior en móvil): se busca el insumo, se escribe una cantidad y
   "Agregar" — suma al total, acumulable. Si el insumo no existe en el
   catálogo, se puede crear uno nuevo.
3. **Conteo físico por categoría.** El voluntario recorre las categorías y
   fija la cantidad real de cada insumo (el total exacto, no un delta). Al
   registrar, el insumo queda marcado como *contado*.
4. **Bitácora.** Cada registro de conteo (delta aplicado, quién, cuándo)
   queda anotado y agrupado por día. Se puede corregir/borrar un registro
   individual, revirtiendo su efecto sobre el total del insumo.
5. **Resumen y exportación.** Progreso global y por categoría; exportación a
   Excel (vía SheetJS/`xlsx`) lista para cargar en AcopioUCV.
6. **Login obligatorio para admin/coordinador.** Cédula + contraseña contra
   la RPC compartida `person_login` (sin Supabase Auth desde 2026-07-19) —
   solo `admin` y `coordinador` de un área que no sea la de las otras 2
   apps tienen acceso; `voluntario` y cualquier otro coordinador quedan
   afuera por completo, esta es la app más restrictiva de las 3 (ver
   [05-autenticacion.md](./05-autenticacion.md)).
7. **Checkpoints.** Snapshots locales del conteo completo, automáticos
   (cada ~6h si hay algo contado) y manuales, para no perder el trabajo de un
   inventario a medias.
8. **Local-first + sincronización opcional.** Todo vive primero en
   IndexedDB del navegador; funciona sin internet. Si hay credenciales de
   Supabase configuradas, además sincroniza para que varios voluntarios
   cuenten a la vez en tiempo real.
9. **Despachos por área (nuevo 2026-07-24).** Pestaña ajena al motor de
   conteo (no pasa por `store.js`/`db.js`/`sync.js`): cada ítem de una
   comanda de UCVComandas (origen manual/personal) genera un despacho
   pendiente, filtrado por la categoría del producto — el coordinador cuya
   `area` coincide con esa categoría lo ve en "Despachos" y lo confirma con
   el botón "Entregar". Pega directo contra 2 RPC nuevas
   (`list_despachos_pendientes`/`marcar_despacho_entregado`,
   `new_schema_archive`) — mismo patrón que `views/voluntarios.js`, ver
   [04-vistas-ui.md](./04-vistas-ui.md#viewsdespachosjs--despachos-por-área-nuevo-2026-07-24).

## Stack técnico

- **Sin build step / sin framework.** HTML + CSS + JS con módulos ES nativos
  (`<script type="module">`). Debe servirse por HTTP, no abrirse como
  `file://`.
- **Persistencia local:** IndexedDB (vía wrapper propio en `js/db.js`), más
  `localStorage` para checkpoints de sincronización, sesión y nombre del
  contador.
- **Backend (opcional):** Supabase (Postgres + Realtime + REST vía
  PostgREST), configurado en `js/config.js` — proyecto **compartido** con
  AcopioUCV/UCVComandas desde 2026-07-19 (`new_schema_archive`, ver
  [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md)). No usa
  Supabase Auth (login propio por RPC, ver `05-autenticacion.md`).
- **Dependencias externas (CDN, sin bundler):**
  - `@supabase/supabase-js@2` — solo para el canal de Realtime
    (`sync.listenRealtime`); el resto de las llamadas a Supabase se hacen con
    `fetch` directo a la REST API / RPC.
  - `xlsx` (SheetJS) — exportación a Excel.
  - Fuentes de Google Fonts: Space Grotesk, Inter, JetBrains Mono.
- **`package.json`** solo declara `@supabase/supabase-js` y `xlsx` como
  dependencias — probablemente vestigial, ya que el `index.html` las carga
  por CDN (`<script src="https://cdn...">`), no via `import` de node_modules.
- **PWA:** `manifest.json` + `sw.js` (service worker con caché
  offline-first). Ver [07-pwa-offline.md](./07-pwa-offline.md).

## Estructura de carpetas

```
UCVInventario/
├── index.html            · shell de la app (sidebar + statusbar + nav móvil)
├── manifest.json  sw.js   · PWA / offline
├── icon.svg
├── documentation/         · esta documentación
├── supabase/              · esquema SQL histórico (proyecto externo viejo,
│                            ya no en uso — ver doc #8)
├── build.js  vercel.json   · genera js/env-config.js (DB_SCHEMA), nuevo 2026-07-19
├── css/styles.css         · tema visual heredado de AcopioUCV
└── js/
    ├── app.js             · bootstrap + navegación + ciclo de vida
    ├── config.js          · credenciales del proyecto Supabase compartido
    ├── env-config.js       · DB_SCHEMA (generado por build.js), nuevo 2026-07-19
    ├── seed.js             · catálogo semilla (1674 insumos en 0)
    ├── db.js               · wrapper de IndexedDB (4 stores)
    ├── sync.js             · sincronización con Supabase (cola offline)
    ├── auth.js             · sesión por CI+contraseña (RPC person_login, sin Supabase Auth)
    ├── checkpoints.js       · respaldos locales del conteo
    ├── store.js             · estado central + lógica de negocio
    ├── helpers.js            · utilidades puras + catálogo de categorías
    ├── components/toast.js   · notificaciones flotantes
    └── views/
        ├── conteo.js       · conteo por categoría (vista principal)
        ├── quickadd.js     · panel de agregado rápido
        ├── registro.js     · bitácora con corrección
        ├── resumen.js      · progreso + exportar Excel
        ├── admin.js        · login + panel de admin/coordinador
        ├── voluntarios.js  · hub de gestión de usuarios de las 3 apps (reescrito 2026-07-19)
        └── despachos.js    · despachos pendientes por área, comandas de UCVComandas (nuevo 2026-07-24)
```

Ver [02-arquitectura-frontend.md](./02-arquitectura-frontend.md) para el
detalle de cómo se conectan estas piezas.
