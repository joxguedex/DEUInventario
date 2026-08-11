# Documentación — GBSInventario

Documentación técnica del proyecto, dividida por partes del sistema para
que cada archivo se pueda leer de forma independiente.

> **Reescrita por completo el 2026-08-11.** Todo lo que describía esta
> documentación antes de esa fecha (base de datos compartida con
> AcopioUCV/UCVComandas, login por cédula+contraseña vía RPC propia sin
> Supabase Auth, panel único `quickadd.js`, catálogo de categorías fijo de
> 13 entradas, etc.) describía una versión del sistema muy anterior a la
> migración a proyecto Supabase independiente y ya no aplica — se
> regeneró desde cero contra el código y el esquema SQL actuales.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [01-vision-general.md](./01-vision-general.md) | Qué es la app, plantilla reutilizable, flujo de uso, stack, estructura de carpetas |
| 2 | [02-arquitectura-frontend.md](./02-arquitectura-frontend.md) | `index.html`, `app.js` (bootstrap/nav/RBAC), `css/styles.css` (paleta de marca) |
| 3 | [03-estado-local-store.md](./03-estado-local-store.md) | `store.js`, `db.js` (IndexedDB), `helpers.js`, `seed.js` |
| 4 | [04-vistas-ui.md](./04-vistas-ui.md) | Cada vista (`conteo`, `ingresorapido`, `egresorapido`, `registro`, `ingresos`, `egresos`, `resumen`, `comunicados`, `voluntarios`, `despachos`, `admin`) y los componentes compartidos |
| 5 | [05-autenticacion.md](./05-autenticacion.md) | `auth.js` — Supabase Auth, roles/área, RBAC, gestión de usuarios |
| 6 | [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md) | `sync.js` — cola offline, push/pull, Realtime |
| 7 | [07-pwa-offline.md](./07-pwa-offline.md) | `manifest.json`, `sw.js`, `checkpoints.js` |
| 8 | [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md) | Esquema de `supabase/new-project-schema.sql`, RLS, RPCs, Edge Function (nombre de archivo histórico, contenido al día) |

## Cómo se generó

Lectura directa de todo el código fuente (`index.html`, `css/styles.css`,
`js/**/*.js`, `supabase/**/*.sql`, `supabase/functions/**`,
`manifest.json`, `sw.js`, `build.js`, `vercel.json`) el 2026-08-11. Es
documentación **estática**, del código tal como está en el repo en ese
momento — si el código cambia, conviene regenerarla.
