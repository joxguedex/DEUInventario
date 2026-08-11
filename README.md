# GBSInventario — Gestión de Inventario

PWA (Progressive Web App) en JavaScript vanilla — sin framework, sin
bundler — para gestionar el inventario de insumos de una organización:
catálogo por categorías, ingresos y egresos de stock, bitácora de
movimientos, comunicados internos y gestión de usuarios. Pensada como
**plantilla reutilizable**: nombre del sistema y paleta de colores se
cambian en dos archivos (ver abajo), y el catálogo arranca vacío para que
cada organización lo arme desde cero.

Backend propio en Supabase (Postgres + Auth + Realtime + PostgREST + una
Edge Function) — sin conexión a ningún otro sistema.

## Cómo funciona

- **Catálogo desde cero.** `js/seed.js` está vacío a propósito — cada
  organización crea sus propias categorías (admin, desde el panel de
  perfil) y carga sus insumos vía Ingreso Rápido o importación de Excel.
- **Ingreso Rápido (offline-first).** Busca el insumo, escribe la cantidad,
  "Sumar" — se aplica localmente al instante y se sincroniza después. Si no
  existe, "Crear insumo nuevo".
- **Egreso Rápido (online-only).** Arma un carrito de insumos + un destino
  de texto libre, y genera una comanda real con reserva de stock atómica
  del lado del servidor — requiere conexión, no se encola.
- **Insumos.** Quien tenga sesión con permiso de edición ajusta cantidades directo desde
  cada tarjeta (`+`/`−`/input) o abre "Editar insumo" (nombre, categoría,
  cantidad, umbral, fusionar con un duplicado, eliminar).
- **Historial.** Cada movimiento (Recepción/Conteo/Egreso) queda apuntado
  con hora, insumo, quién y cantidad, agrupado por día y filtrable por
  tipo. Se puede corregir/borrar un registro puntual.
- **Ingresos / Egresos.** Reportes de solo lectura por día, con una flecha
  directa a Historial para ubicar y corregir un registro concreto.
- **Comunicados.** Avisos internos (informativo/urgente/crítico).
- **Resumen.** Hero de estado + estadísticas + desglose por categoría +
  comunicados recientes. Pestaña por defecto al iniciar sesión.
- **Login (correo + contraseña, Supabase Auth).** Solo `admin` y
  `coordinador` (de una categoría real, o del área especial `general` —
  consulta sin edición) tienen acceso. Ver
  [documentation/05-autenticacion.md](./documentation/05-autenticacion.md).
- **Checkpoints / auto-respaldo.** Snapshots locales del conteo (auto cada
  ~6h si hay algo contado, y manuales) con restaurar, admin-only. Viven en
  el panel de perfil.
- **Local-first.** Todo se guarda primero en el navegador (IndexedDB).
  Funciona sin internet para el conteo/Ingreso Rápido; sincroniza cuando
  hay conexión.
- **Exportar.** Excel desde Ingreso Rápido (herramientas admin) y desde
  cada modal de detalle de día en Ingresos/Egresos.

## Plantilla reutilizable

Dos archivos concentran toda la personalización de marca:

- **`js/branding.js`** — nombre del sistema y la descripción del hero de
  Resumen.
- **`css/styles.css` → `:root`** — `--brand-primary`/`--brand-secondary`;
  el resto de la hoja deriva sus tintes de esos dos valores.

Excepciones que sí hay que editar a mano al rebrandear (estáticas, leídas
por el navegador/SO antes de que exista una página): `manifest.json` e
`icon.svg`. Detalle completo en
[documentation/01-vision-general.md](./documentation/01-vision-general.md).

## Estructura

```
GBSInventario/
├── index.html            · shell (topnav + statusbar + nav móvil)
├── manifest.json  sw.js  · PWA / offline
├── icon.svg
├── build.js  vercel.json · genera js/env-config.js (DB_SCHEMA) en cada deploy
├── supabase/             · esquema SQL (new-project-schema.sql = canónico,
│                           YYYY-MM-DD-*.sql = migraciones incrementales)
│   └── functions/manage-users/ · Edge Function (Admin API)
├── css/styles.css        · hoja de estilos única, paleta vía --brand-*
└── js/
    ├── app.js            · bootstrap + navegación + RBAC
    ├── branding.js       · nombre del sistema + descripción del hero
    ├── config.js         · credenciales del proyecto Supabase
    ├── env-config.js     · DB_SCHEMA (generado por build.js)
    ├── seed.js           · catálogo semilla — vacío a propósito
    ├── db.js             · IndexedDB (conteo + log + checkpoints + queue)
    ├── sync.js           · sincronización Supabase (cola offline + Realtime)
    ├── auth.js            · sesión Supabase Auth (correo+contraseña, rol/área)
    ├── checkpoints.js    · respaldos locales del conteo
    ├── store.js           · estado + conteos + bitácora + categorías
    ├── helpers.js         · categorías dinámicas, formato, utilidades
    ├── components/       · toast, modal genérico, confirm/prompt custom
    └── views/
        ├── conteo.js         · Insumos
        ├── ingresorapido.js  · Ingreso Rápido
        ├── egresorapido.js   · Egreso Rápido
        ├── registro.js       · Historial (bitácora)
        ├── ingresos.js       · reporte de recepciones
        ├── egresos.js        · reporte de entregas
        ├── resumen.js        · hero + estadísticas
        ├── comunicados.js    · avisos internos
        ├── admin.js          · login + perfil + categorías + respaldos
        ├── voluntarios.js    · gestión de usuarios (admin-only)
        └── despachos.js      · oculto, código dormido
```

Detalle completo en [documentation/](./documentation/README.md).

## Gestión de usuarios

Solo un `admin` da de alta/edita/revoca usuarios, desde la pestaña
**Usuarios** (oculta del nav para cualquier otra cuenta). Alta y edición
completa (nombre, apellido, cédula, teléfono, correo, área, contraseña) —
detrás hay dos piezas: RPCs normales para los datos de la persona
(`create_person`/`admin_update_person`) y una Edge Function
(`supabase/functions/manage-users`) para lo que exige la Admin API de
Supabase (crear/editar la cuenta de Auth en sí). Ver
[documentation/05-autenticacion.md](./documentation/05-autenticacion.md).

## Base de datos

Proyecto Supabase **propio**, credenciales en `js/config.js`. Esquema
canónico en
[`supabase/new-project-schema.sql`](./supabase/new-project-schema.sql);
migraciones incrementales fechadas en `supabase/YYYY-MM-DD-*.sql` para el
proyecto ya vivo (pegar en el SQL Editor). Detalle completo (mapa de
secciones, RLS, RPCs, Edge Function) en
[documentation/08-base-de-datos-PENDIENTE.md](./documentation/08-base-de-datos-PENDIENTE.md)
(nombre de archivo histórico, contenido al día).

## Desarrollo local

Al ser módulos ES, necesita servirse por HTTP (no `file://`):

```bash
npx serve .      # o:  python -m http.server 8080
```

## Versionado

`js/version.js` (`APP_VERSION`) es un contador simple de despliegues, no
semver — se incrementa +0.01 en cada commit&push a `main` (ver
`CLAUDE.md`), junto con `sw.js#CACHE`.
