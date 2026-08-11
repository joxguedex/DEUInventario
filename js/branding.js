// ── Configuración de marca — plantilla reutilizable ────────
// Cambiar estos valores adapta el nombre del sistema y la descripción del
// "Centro Operativo" (Resumen) a otra organización, sin tocar el resto del
// código. Los colores NO viven acá — son propiedades CSS, ver
// css/styles.css#:root (--brand-primary/--brand-secondary).
//
// app.js aplica estos valores en el arranque (título de la pestaña,
// nombre en la barra superior desktop/móvil). Dos excepciones que SÍ hay
// que editar a mano, aparte, al rebrandear: `manifest.json` (name/
// short_name) y la meta `apple-mobile-web-app-title` de index.html — el
// navegador las lee directo como archivo/HTML estático, antes de que
// corra cualquier JS (instalación como PWA / "Agregar a inicio").

export const APP_NAME_BOLD = 'GBS';         // parte del nombre en blanco (topnav)
export const APP_NAME_REST = 'Inventario';  // parte del nombre en el color principal
export const APP_NAME = APP_NAME_BOLD + APP_NAME_REST;
export const APP_TITLE = `${APP_NAME} — Gestión de Inventario`;

// Subtítulo bajo "Centro Operativo" (hero de Resumen, ver views/resumen.js).
export const HERO_DESCRIPTION = 'Aquí va la ubicación del centro…';
