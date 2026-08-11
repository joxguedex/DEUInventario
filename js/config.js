// ============================================================
// GBSInventario · Configuración de Supabase
// ------------------------------------------------------------
// Proyecto propio e independiente (qbwrtswkmwzpbmhkzxdh) — desde la
// migración a esquema nuevo (ver supabase/new-project-schema.sql), ya no
// comparte base con AcopioUCV/UCVComandas. Esquema en `public` (ver
// js/env-config.js), con Supabase Auth real (js/auth.js) en vez del login
// propio sin JWT que usaba el proyecto compartido viejo.
// ============================================================

export const SUPABASE_URL = 'https://qbwrtswkmwzpbmhkzxdh.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_TWoAoZ3gSGF0O_XfROpUrg_AWVJmg-4';

// products (name+category_id+umbral+unidad+client_id), inventory
// (qnty/last_counted_at/last_counted_by derivados por trigger/RPC) y los RPC
// apply_count/uncount_item/delete_count para registrar conteos — ver
// supabase/new-project-schema.sql para el esquema completo.

export const SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
