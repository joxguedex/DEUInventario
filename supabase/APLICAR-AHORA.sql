-- ============================================================
-- ⚠️  EJECUTAR YA · Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Diagnóstico (22-jul-2026): la base de datos NO tiene las dos
-- funciones que la app necesita para CORREGIR conteos:
--
--     uncount_item   → 404  (no existe)
--     delete_count   → 404  (no existe)
--     apply_count    → ✅ sí existe (por eso contar sí funciona)
--
-- Consecuencia real: cuando un voluntario DESMARCA un insumo o
-- BORRA un registro de la bitácora, la app se lo muestra como
-- hecho, pero la nube nunca se entera. En la siguiente sincro-
-- nización el conteo viejo REVIVE con su cantidad anterior.
-- Es exactamente el problema de "cantidades infladas" que esta
-- app existe para resolver.
--
-- Este archivo es el contenido de fix-unmark-delete.sql, que
-- quedó sin aplicar. Es idempotente: se puede correr sin miedo,
-- y correrlo dos veces no hace daño.
-- ============================================================


-- ── uncount_item: retracta TODO el conteo de un insumo ─────
CREATE OR REPLACE FUNCTION public.uncount_item(p_product_client_id TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_pid BIGINT; v_next BIGINT; v_hops INTEGER := 0;
BEGIN
  SELECT id INTO v_pid FROM products WHERE client_id = p_product_client_id;
  IF v_pid IS NULL THEN RETURN; END IF;

  LOOP
    SELECT merged_into INTO v_next FROM products WHERE id = v_pid;
    EXIT WHEN v_next IS NULL;
    v_pid := v_next; v_hops := v_hops + 1;
    IF v_hops > 10 THEN RAISE EXCEPTION 'Ciclo en merged_into para %', p_product_client_id; END IF;
  END LOOP;

  DELETE FROM movements
   WHERE id IN (SELECT movement_id FROM movement_items WHERE product_id = v_pid);

  UPDATE inventory
     SET qnty = 0, last_counted_at = NULL, last_counted_by = NULL
   WHERE product_id = v_pid;
END; $fn$;


-- ── delete_count: borra UN registro de la bitácora ─────────
CREATE OR REPLACE FUNCTION public.delete_count(p_client_op_id TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_mid     BIGINT;
  v_dir     movement_direction;
  v_last_at TIMESTAMPTZ;
  v_last_by TEXT;
  r         RECORD;
BEGIN
  SELECT id, direction INTO v_mid, v_dir
    FROM movements WHERE client_op_id = p_client_op_id;
  IF v_mid IS NULL THEN RETURN; END IF;

  FOR r IN SELECT product_id, qnty FROM movement_items WHERE movement_id = v_mid LOOP
    IF v_dir = 'in' THEN
      UPDATE inventory SET qnty = GREATEST(0, qnty - r.qnty) WHERE product_id = r.product_id;
    ELSE
      UPDATE inventory SET qnty = qnty + r.qnty WHERE product_id = r.product_id;
    END IF;

    -- Último conteo que SOBREVIVE al borrado. Si no queda ninguno, el
    -- SELECT INTO deja ambas variables en NULL y el insumo vuelve a
    -- contar como "no contado" en el pull de todos los dispositivos.
    SELECT m.occurred_at, m.note
      INTO v_last_at, v_last_by
      FROM movements m
      JOIN movement_items mi ON mi.movement_id = m.id
     WHERE mi.product_id = r.product_id
       AND m.id != v_mid
     ORDER BY m.occurred_at DESC
     LIMIT 1;

    UPDATE inventory
       SET last_counted_at = v_last_at,
           last_counted_by = v_last_by
     WHERE product_id = r.product_id;
  END LOOP;

  DELETE FROM movements WHERE id = v_mid;
END; $fn$;


-- ── Permiso de ejecución (contar es libre, sin login) ──────
GRANT EXECUTE ON FUNCTION public.uncount_item(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_count(TEXT) TO anon, authenticated;

-- Refrescar el caché de esquema de PostgREST para que las vea ya
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- ✅ VERIFICACIÓN 1 · las funciones ya existen
-- ============================================================
SELECT proname AS funcion, 'OK' AS estado
  FROM pg_proc
 WHERE proname IN ('apply_count', 'uncount_item', 'delete_count')
 ORDER BY proname;
-- Deben salir las TRES filas.


-- ============================================================
-- ✅ VERIFICACIÓN 2 · TUS USUARIOS REGISTRADOS
-- ------------------------------------------------------------
-- Esto no se puede consultar desde la app (la clave pública no
-- da acceso a auth.users). Córrelo aquí para ver quién puede
-- iniciar sesión de verdad.
-- ============================================================
SELECT
  email,
  CASE WHEN email_confirmed_at IS NULL
       THEN '❌ SIN CONFIRMAR — no podrá entrar'
       ELSE '✅ puede iniciar sesión' END AS estado,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at;
-- Si alguien sale "SIN CONFIRMAR", arréglalo con:
--   UPDATE auth.users SET email_confirmed_at = now()
--    WHERE email_confirmed_at IS NULL;


-- ============================================================
-- ℹ️  VERIFICACIÓN 3 · conteos sin atribución ("contado por")
-- ============================================================
SELECT count(*) FILTER (WHERE note IS NULL)     AS sin_nombre,
       count(*) FILTER (WHERE note IS NOT NULL) AS con_nombre
  FROM movements;
-- El arreglo de la app (v41) evita que sigan entrando sin nombre.
-- Los ya registrados sin nombre no se pueden recuperar: el dato
-- nunca salió del teléfono.
