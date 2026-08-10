# Inventario UCV — Conteo Físico test20

App **independiente** del sistema AcopioUCV para hacer un **inventario físico real**
de los insumos del centro de acopio. Nace porque el sistema de acopio tiene
cantidades infladas (no se descontaron las entregas), así que aquí se cuenta
desde cero lo que **realmente hay** y luego se carga de vuelta al acopio.

Misma temática, mismo catálogo, mismo lenguaje visual y — desde el 2026-07-19 —
**base de datos compartida** con AcopioUCV/UCVComandas (despliegue propio). Nada
de lo que se cuenta aquí toca al sistema de acopio hasta que exportes los
resultados.

## Cómo funciona

- **Catálogo precargado en 0.** Los **1674 insumos** activos del acopio ya están
  cargados, agrupados por categoría, todos en cantidad `0`. Se conserva el `id`
  original de cada insumo para poder cruzar los conteos con el acopio.
- **Agregado rápido (mobile-first).** Barra arriba de la vista de conteo: buscas
  el insumo, escribes la cantidad y *Agregar* — suma al total (se puede acumular
  varias veces) sin scrollear. Si no está en el catálogo, *Crear insumo nuevo*.
- **Conteo físico.** El voluntario recorre las categorías y escribe la cantidad
  real de cada insumo (fija el total exacto). Al registrar, queda marcado como
  *contado*. Botones `+/−` y `Enter` para saltar al siguiente.
- **Bitácora (log).** Cada registro de conteo queda apuntado con hora, insumo,
  quién contó y cantidad, agrupado por día. Se puede **corregir/borrar** un
  registro y el total del insumo se revierte automáticamente.
- **Progreso.** Barra global (contados / total) y desglose por categoría en la
  vista *Resumen*.
- **Login obligatorio (cédula + contraseña).** No es Supabase Auth: valida
  contra la RPC compartida `person_login` (`new_schema_archive`, hash bcrypt
  del lado del servidor). Es la app más restrictiva de las tres — solo entran
  `admin` y `coordinador` de un área que no sea la de AcopioUCV/UCVComandas;
  no hay conteo libre sin sesión. Ver
  [documentation/05-autenticacion.md](./documentation/05-autenticacion.md).
- **Checkpoints / auto-respaldo.** Snapshots locales del conteo (auto cada ~6h si
  hay algo contado, y manuales) con **restaurar**, para no perder un inventario a
  medias. Viven en el panel de coordinador.
- **Local-first.** Todo se guarda en el navegador (IndexedDB). Funciona sin
  internet. Si hay credenciales de Supabase, además sincroniza para que varios
  voluntarios cuenten a la vez.
- **Exportar.** Desde *Resumen* → Excel con `id`, insumo, categoría, unidad y
  cantidad contada — listo para cargar en el sistema de acopio.

## Estructura

```
UCVInventario/
├── index.html            · shell (sidebar + statusbar + nav móvil)
├── manifest.json  sw.js  · PWA / offline
├── icon.svg
├── supabase/             · esquema SQL histórico (proyecto externo viejo,
│                           ya no en uso — ver documentation/08-base-de-datos-PENDIENTE.md)
├── build.js  vercel.json · genera js/env-config.js (DB_SCHEMA) en cada deploy
├── css/styles.css        · tema heredado de AcopioUCV
└── js/
    ├── app.js            · bootstrap + navegación
    ├── config.js         · credenciales del proyecto Supabase compartido
    ├── env-config.js     · DB_SCHEMA (generado por build.js)
    ├── seed.js           · catálogo (1674 insumos en 0)
    ├── db.js             · IndexedDB (stores: conteo + log + checkpoints + queue)
    ├── sync.js           · sincronización Supabase (upsert + pull, outbox offline)
    ├── auth.js           · sesión por CI + contraseña (RPC person_login, sin Supabase Auth)
    ├── checkpoints.js    · respaldos locales del conteo
    ├── store.js          · estado + conteos + bitácora + reset
    ├── helpers.js        · categorías, iconos, utilidades
    ├── components/toast.js
    └── views/
        ├── conteo.js      · conteo por categoría
        ├── quickadd.js    · panel de agregado rápido
        ├── registro.js    · bitácora (log) con corrección
        ├── resumen.js     · progreso + exportar Excel
        ├── admin.js       · login + panel de admin/coordinador (respaldos)
        └── voluntarios.js · hub de gestión de usuarios de las 3 apps
```

## Gestión de usuarios (admin/coordinador/voluntario)

Los usuarios viven en `person_credentials`, tabla **compartida** con
AcopioUCV/UCVComandas — no hay Supabase Auth ni pantalla de auto-registro.
Un `admin` ya existente crea/edita/elimina coordinadores y voluntarios desde
la pestaña **Gestión de Usuarios** de la app (RPCs `create_user`/
`update_user_role`/`delete_user`); un `coordinador` solo puede dar de alta
voluntarios de su propia área, nunca otros coordinadores. El primer `admin`
del sistema se crea directo contra la base (no hay flujo dentro de la app
para eso). Detalle completo en
[documentation/05-autenticacion.md](./documentation/05-autenticacion.md).

## Base de datos

Desde el 2026-07-19 esta app usa el **proyecto Supabase compartido** con
AcopioUCV/UCVComandas (esquema `new_schema_archive`) — las credenciales ya
están en `js/config.js`, no hace falta configurarlas a mano. Los scripts en
`supabase/*.sql` son del proyecto externo **viejo** y ya no se ejecutan
contra nada; se conservan como referencia histórica. El esquema real
(`products`/`inventory`/`movements`/`movement_items`/`persons`/
`person_credentials`, triggers, RLS/grants) está documentado en
[documentation/08-base-de-datos-PENDIENTE.md](./documentation/08-base-de-datos-PENDIENTE.md).

## Desarrollo local

Al ser módulos ES, necesita servirse por HTTP (no `file://`):

```bash
npx serve .      # o:  python -m http.server 8080
```

## Regenerar el catálogo

El catálogo (`js/seed.js`) es un snapshot de los insumos activos de AcopioUCV.
Si el catálogo del acopio cambia, se regenera consultando su tabla `items` y
volcando cada insumo con `cantidad: 0` (ver README de acopio / scratch).
