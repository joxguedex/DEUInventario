// ============================================================
// GBSInventario · Configuración de Supabase
// ------------------------------------------------------------
// Proyecto compartido con UCVAcopio/UCVComandas (fndrmxjykrtoddhstbyv),
// esquema new_schema_archive (ver js/env-config.js). Antes de la
// unificación esta app hablaba con un proyecto externo aparte
// (bwdipsshosclqoxbjbho) — ese proyecto queda desconectado.
// ============================================================

export const SUPABASE_URL = 'https://fndrmxjykrtoddhstbyv.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_o48z5n8Gad0DFLW7an4qxw_Pf-UGlzL';

// La app usa el esquema unificado (ver ../supabase-migrations/ en la raíz del
// proyecto): products (name+type+umbral+unidad+client_id), inventory
// (qnty/last_counted_at/last_counted_by derivados por trigger/RPC) y los RPC
// apply_count/uncount_item/delete_count para registrar conteos.

export const SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
