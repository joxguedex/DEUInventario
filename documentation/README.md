# Documentación — Inventario UCV (Conteo Físico)

Documentación técnica del proyecto, generada a partir de una lectura completa
del código fuente en el repositorio. Está dividida por partes del sistema para
que cada archivo se pueda leer de forma independiente.

> **Actualizado 2026-07-19**: la nota que seguía acá ("todo lo que requiere
> verificarse contra la instancia real de Supabase queda pendiente hasta
> tener el `.env`") ya no aplica — la unificación de acceso con
> UCVAcopio/UCVComandas cortó la conexión de Inventario al proyecto
> compartido, y ese trabajo sí verificó esquema real, RLS/grants y RPCs
> contra la BD en vivo (consultas directas + pruebas end-to-end con datos
> sintéticos). Ver [`08-base-de-datos-PENDIENTE.md`](./08-base-de-datos-PENDIENTE.md)
> (nombre de archivo conservado por los enlaces existentes, contenido ya no
> pendiente) y [`05-autenticacion.md`](./05-autenticacion.md).

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [01-vision-general.md](./01-vision-general.md) | Qué es la app, para qué existe, relación con AcopioUCV, stack |
| 2 | [02-arquitectura-frontend.md](./02-arquitectura-frontend.md) | Estructura de carpetas, `index.html`, `app.js`, ciclo de vida, RBAC |
| 3 | [03-estado-local-store.md](./03-estado-local-store.md) | `store.js`, `db.js` (IndexedDB), `helpers.js`, `seed.js` (catálogo) |
| 4 | [04-vistas-ui.md](./04-vistas-ui.md) | Las 5 vistas (`conteo`, `quickadd`, `registro`, `resumen`, `voluntarios`) y `toast.js` |
| 5 | [05-autenticacion.md](./05-autenticacion.md) | `auth.js`, `admin.js` — login por CI+contraseña (RPC compartida), roles/área, RBAC |
| 6 | [06-sincronizacion-cliente.md](./06-sincronizacion-cliente.md) | `sync.js` — cola offline, push/pull, Realtime, contra el proyecto Supabase compartido |
| 7 | [07-pwa-offline.md](./07-pwa-offline.md) | `manifest.json`, `sw.js`, comportamiento offline-first |
| 8 | [08-base-de-datos-PENDIENTE.md](./08-base-de-datos-PENDIENTE.md) | Esquema real de `new_schema_archive`, RLS/grants, RPCs — verificado 2026-07-19, ya no pendiente |

## Cómo se generó

Lectura directa de todos los archivos fuente (`index.html`, `css/styles.css`,
`js/**/*.js`, `manifest.json`, `sw.js`) el 2026-07-17. No se ejecutó la app ni
se consultó ninguna base de datos en vivo — es documentación **estática**, del
código tal como está en el repo en ese momento. Si el código cambia, esta
documentación puede quedar desactualizada y conviene regenerarla.
