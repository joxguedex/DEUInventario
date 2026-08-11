# 1. Visión general

## Qué es

**GBSInventario** es una PWA (Progressive Web App) en JavaScript vanilla
(sin framework, sin build step real) para gestionar el inventario de
insumos de una organización: catálogo por categorías, ingresos y egresos de
stock, bitácora de movimientos, comunicados internos y gestión de usuarios.

Nació como un fork independiente de un sistema hermano (AcopioUCV/
UCVComandas), pero **desde la migración a proyecto Supabase propio ya no
comparte base de datos ni backend con esos sistemas** — es una aplicación
autocontenida. El código conserva algunos nombres internos heredados de esa
época (el nombre interno de la base IndexedDB sigue siendo `ucv-inventario`,
algunas claves de `localStorage` empiezan con `ucv-inv-`), pero eso es
solo un detalle de implementación sin efecto visible; no hay ninguna
conexión activa a los otros sistemas.

## Plantilla reutilizable

Un objetivo explícito del proyecto es que sirva de **plantilla** para que
otra organización lo adopte con el mínimo esfuerzo. Dos superficies
concentran toda la personalización:

- **`js/branding.js`** — nombre del sistema (`APP_NAME_BOLD`/`APP_NAME_REST`,
  usados en el título de pestaña y la marca de la barra superior) y la
  descripción del hero de Resumen (`HERO_DESCRIPTION`).
- **`css/styles.css` → `:root`** — `--brand-primary` (color principal,
  naranja por defecto) y `--brand-secondary` (color secundario, gris oscuro
  por defecto). El resto de la hoja de estilos deriva sus tintes de esos dos
  valores vía `color-mix()` (ver [02-arquitectura-frontend.md](./02-arquitectura-frontend.md)),
  así que cambiar la paleta entera es cambiar dos líneas.

Dos excepciones que sí hay que tocar a mano al rebrandear, porque el
navegador/SO las lee como archivos estáticos antes de que exista una página
donde JS pueda intervenir: `manifest.json` (`name`/`short_name`/
`theme_color`) e `icon.svg`. El `<meta name="theme-color">` de `index.html`
es un caso intermedio: tiene un valor estático de arranque pero
`app.js#boot()` lo sobrescribe en tiempo de ejecución con el
`--brand-secondary` calculado, así que en la práctica no hace falta tocarlo
a mano.

El catálogo semilla (`js/seed.js`) está **vacío a propósito** — cada
organización arma su propio catálogo desde cero (Ingreso Rápido lo permite
sin fricción) en vez de heredar insumos de un centro de acopio ajeno.

## Flujo de uso

1. **Login** — cédula, nombre y correo se registran una sola vez (por un
   admin, desde la pestaña Usuarios); el inicio de sesión en sí es
   **correo + contraseña** contra Supabase Auth. Ver
   [05-autenticacion.md](./05-autenticacion.md).
2. **Resumen** (pestaña por defecto al iniciar sesión) — hero "Centro
   Operativo" con estadísticas rápidas, tarjetas de stock/categorías/
   usuarios activos, desglose de insumos por categoría, y un panel de
   comunicados recientes.
3. **Insumos** — catálogo completo agrupado y filtrable por categoría,
   ajuste de cantidades directo desde cada tarjeta, y un modal de edición
   (nombre, categoría, cantidad, umbral, fusión con un insumo duplicado,
   eliminar).
4. **Ingreso Rápido** / **Egreso Rápido** — panel persistente (barra lateral
   en desktop, hoja inferior en móvil) para sumar stock rápido o registrar
   una entrega. Son mecanismos distintos:
   - **Ingreso Rápido** es offline-first: busca/crea un insumo, escribe
     cantidad, "Sumar" — se aplica localmente de inmediato y se sincroniza
     después.
   - **Egreso Rápido** es online-only: arma un carrito de insumos + un
     campo de texto libre "Destino", y al confirmar genera una comanda real
     (`create_comanda_rapida`) con reserva de stock atómica del lado del
     servidor — no hay "guardar para más tarde" sin conexión.
5. **Historial** — bitácora cronológica de cada movimiento (Recepción /
   Conteo / Egreso), agrupada por día y filtrable por tipo, con
   corregir/borrar por registro.
6. **Ingresos** / **Egresos** — reportes de solo lectura: tarjetas por día
   con totales, top de insumos, y un modal de detalle por día (con
   exportación a Excel). Cada tarjeta tiene una flecha que salta directo a
   Historial con el filtro de tipo y el día correctos ya aplicados, para
   ubicar y corregir un registro puntual.
7. **Comunicados** — avisos internos (informativo/urgente/crítico),
   publicables por cualquier admin/coordinador, resolubles solo por admin.
8. **Usuarios** (admin-only) — alta de personas + otorgar acceso en un solo
   paso, y edición completa de un usuario existente (nombre, apellido,
   cédula, teléfono, correo, área, contraseña).
9. **Despachos** — pestaña oculta para todos los usuarios (código y RPCs
   siguen existiendo, sin uso real con el estado actual del sistema; más
   fácil de reactivar que de rehacer si algún día hace falta).

## Stack técnico

- **Sin build step real.** HTML + CSS + JS con módulos ES nativos
  (`<script type="module">`). Debe servirse por HTTP, nunca abrirse como
  `file://` (los módulos ES lo bloquean por CORS). El único paso de "build"
  es `build.js`, que Vercel corre en cada deploy para generar
  `js/env-config.js` a partir de una variable de entorno — ver
  [02-arquitectura-frontend.md](./02-arquitectura-frontend.md).
- **Persistencia local:** IndexedDB (wrapper propio, `js/db.js`), más
  `localStorage` para checkpoints de sincronización, sesión, nombre del
  contador y cachés de perfil.
- **Backend:** Supabase — Postgres (`supabase/new-project-schema.sql`),
  Auth (roles/área en `app_metadata`), Realtime, REST vía PostgREST, y una
  Edge Function (`supabase/functions/manage-users`) para las operaciones que
  exigen la Admin API (crear/editar cuentas de Auth). Proyecto propio,
  credenciales en `js/config.js`.
- **Dependencias externas (CDN, sin bundler):** `@supabase/supabase-js@2`
  (Realtime + Auth; el resto de las llamadas usa `fetch` directo a la REST
  API/RPC) y `xlsx` (SheetJS, exportación a Excel). Fuentes: Space Grotesk,
  Inter, JetBrains Mono.
- **PWA:** `manifest.json` + `sw.js` (caché offline-first). Ver
  [07-pwa-offline.md](./07-pwa-offline.md).

## Estructura de carpetas

```
GBSInventario/
├── index.html              · shell de la app (topnav + statusbar + nav móvil)
├── manifest.json  sw.js    · PWA / offline
├── icon.svg
├── build.js  vercel.json   · genera js/env-config.js (DB_SCHEMA) en cada deploy
├── documentation/          · esta documentación
├── supabase/
│   ├── new-project-schema.sql   · esquema canónico (fresh install)
│   └── YYYY-MM-DD-*.sql         · migraciones incrementales para el proyecto ya vivo
│   └── functions/manage-users/  · Edge Function (Admin API: crear/editar/revocar accesos)
├── css/styles.css          · hoja de estilos única, paleta vía --brand-primary/--brand-secondary
└── js/
    ├── app.js               · bootstrap + navegación + RBAC de pestañas
    ├── branding.js          · nombre del sistema + descripción del hero (plantilla)
    ├── config.js            · credenciales del proyecto Supabase
    ├── env-config.js        · DB_SCHEMA (generado por build.js)
    ├── seed.js               · catálogo semilla — vacío a propósito
    ├── db.js                 · wrapper de IndexedDB
    ├── sync.js               · sincronización offline-first con Supabase
    ├── auth.js               · sesión Supabase Auth (email+contraseña, rol/área)
    ├── checkpoints.js        · respaldos locales del conteo
    ├── store.js               · estado central + lógica de negocio
    ├── helpers.js             · utilidades + categorías dinámicas
    ├── components/
    │   ├── toast.js           · notificaciones flotantes
    │   ├── modal.js            · gestor genérico de modales (.modal-ov)
    │   └── confirm.js          · confirmDialog/promptDialog (reemplazan confirm()/prompt() nativos)
    └── views/
        ├── conteo.js          · Insumos — catálogo por categoría
        ├── ingresorapido.js   · Ingreso Rápido (offline-first)
        ├── egresorapido.js    · Egreso Rápido (online-only, genera comanda)
        ├── registro.js        · Historial (bitácora) con corrección
        ├── ingresos.js        · reporte de recepciones por día
        ├── egresos.js         · reporte de entregas por día
        ├── resumen.js         · hero + estadísticas + comunicados recientes
        ├── comunicados.js     · avisos internos
        ├── admin.js           · login wall + panel de perfil/categorías/respaldos
        ├── voluntarios.js     · gestión de usuarios (admin-only)
        └── despachos.js       · despachos por área — oculto, código dormido
```

Ver [02-arquitectura-frontend.md](./02-arquitectura-frontend.md) para el
detalle de cómo se conectan estas piezas.
