// ============================================================
// GBSInventario · Configuración de Supabase
// ------------------------------------------------------------
// Proyecto compartido con UCVAcopio/UCVComandas (fndrmxjykrtoddhstbyv), pero
// AISLADO en su propio schema de Postgres (`sibex`, ver js/env-config.js y
// supabase/sibex-schema-install.sql) en vez de `public` — así no se mezclan
// tablas/datos con esos sistemas hermanos aunque compartan el mismo
// proyecto/base. Supabase Auth real (js/auth.js), no el login propio sin
// JWT que usaba el esquema viejo de este mismo proyecto.
// ============================================================

export const SUPABASE_URL = 'https://fndrmxjykrtoddhstbyv.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_o48z5n8Gad0DFLW7an4qxw_Pf-UGlzL';

// products (name+category_id+umbral+unidad+client_id), inventory
// (qnty/last_counted_at/last_counted_by derivados por trigger/RPC) y los RPC
// apply_count/uncount_item/delete_count para registrar conteos — ver
// supabase/new-project-schema.sql para el esquema completo.

export const SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
