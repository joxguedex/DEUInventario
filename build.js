// Build step de Vercel (ver vercel.json "buildCommand") — este sitio no
// tiene bundler ni transpilación, lo único que hace este script es grabar
// la variable de entorno DB_SCHEMA como literal en js/env-config.js, para
// poder usar el mismo código contra distintos esquemas de Postgres según
// la rama de deploy (mismo patrón que ya usa UCVAcopio/build.js).
const fs = require('fs');
const path = require('path');

const schema = process.env.DB_SCHEMA || 'new_schema_archive';

const content = `// GENERADO por build.js a partir de la env var DB_SCHEMA de Vercel — no editar a mano en un deploy.
// En desarrollo local (sin build) se usa el valor committeado en este archivo.
export const DB_SCHEMA = ${JSON.stringify(schema)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'env-config.js'), content);
console.log(`[build] js/env-config.js generado con DB_SCHEMA=${schema}`);
