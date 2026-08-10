-- ============================================================
-- UCVInventario · Fusión de duplicados y limpieza del catálogo
-- ------------------------------------------------------------
-- GENERADO desde un volcado real de products (2026-07-09).
-- Respaldo: scratchpad/products_backup.json (1715 filas)
--
-- Todo va en una transacción con verificación final: si el total
-- no cuadra, se revierte entero.
--
--   Unidades antes ....... 39390
--   Se descartan ......... 6460   (doble conteo confirmado)
--   Unidades después ..... 32930
--   Filas vivas .......... 1715 → 1676
--
-- Las filas absorbidas NO se borran: se marcan con deleted_at.
-- El pull las elimina de cada dispositivo; su historial en
-- movement_items queda intacto para auditoría.
-- ============================================================
BEGIN;

-- ── 0. PREFLIGHT ────────────────────────────────────────────
-- El catálogo está vivo: la gente cuenta mientras lees esto. Si alguna
-- fila a descartar cambió de cantidad desde el volcado, este bloque
-- aborta la transacción entera. Regenera el script y vuelve a revisar.
CREATE TEMP TABLE _esperado (id BIGINT PRIMARY KEY, qnty INTEGER) ON COMMIT DROP;
INSERT INTO _esperado (id, qnty) VALUES
  (118, 60),
  (470, 1000),
  (6947, 3000),
  (6952, 1600),
  (6988, 800),
  (95, 0),
  (124, 0),
  (257, 0),
  (364, 0),
  (453, 0),
  (550, 0),
  (551, 0),
  (605, 0),
  (709, 0),
  (719, 0),
  (764, 0),
  (788, 0),
  (792, 0),
  (896, 0),
  (954, 0),
  (1028, 0),
  (1054, 0),
  (1208, 0),
  (1211, 0),
  (1213, 0),
  (1215, 0),
  (1229, 0),
  (1241, 0),
  (1270, 0),
  (1302, 0),
  (1308, 0),
  (1345, 0),
  (1398, 0),
  (1472, 0),
  (1540, 0),
  (94, 0),
  (194, 0),
  (217, 0),
  (429, 0);

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT e.id, e.qnty AS esperado, i.qnty AS real_
      FROM _esperado e
      JOIN products  p ON p.id = e.id
      JOIN inventory i ON i.product_id = e.id
     WHERE p.deleted_at IS NULL AND i.qnty <> e.qnty
  LOOP
    RAISE EXCEPTION
      'La fila % cambió: esperaba % unidades, hay %. Alguien contó después del volcado. Abortado.',
      r.id, r.esperado, r.real_;
  END LOOP;
END $$;

-- Total antes, para verificar el delta al final (no un número absoluto:
-- otras filas pueden haber cambiado legítimamente mientras tanto).
CREATE TEMP TABLE _antes ON COMMIT DROP AS
  SELECT COALESCE(SUM(i.qnty),0) AS total
    FROM inventory i JOIN products p ON p.id = i.product_id
   WHERE p.deleted_at IS NULL;

-- ── 1. Pares sinónimo: el MISMO stock físico se contó dos veces ─────
-- Se conserva la cantidad de la fila canónica; la otra se descarta.
-- NO se suman: sumar duplicaría un inventario que no existe.

-- CONSERVA [534] 'Toallas húmedas' (s/m) = 3086 und
--   descarta [6947] 'Toallitas húmedas' (s/m) = 3000 und
--   OJO: discrepancia 3086 vs 3000 → se toma 3086 (fila canónica)
UPDATE inventory SET qnty = 0 WHERE product_id IN (6947);
UPDATE products  SET deleted_at = now(), merged_into = 534 WHERE id IN (6947);

-- CONSERVA [506] 'Pasta dental' (s/m) = 1713 und
--   descarta [6952] 'Crema dental' (s/m) = 1600 und
--   OJO: discrepancia 1713 vs 1600 → se toma 1713 (fila canónica)
UPDATE inventory SET qnty = 0 WHERE product_id IN (6952);
UPDATE products  SET deleted_at = now(), merged_into = 506 WHERE id IN (6952);

-- CONSERVA [468] 'Jabón de baño' (s/m) = 1000 und
--   descarta [470] 'Jabón en barra' (s/m) = 1000 und
UPDATE inventory SET qnty = 0 WHERE product_id IN (470);
UPDATE products  SET deleted_at = now(), merged_into = 468 WHERE id IN (470);

-- CONSERVA [180] 'Granos variados' (s/m) = 800 und
--   descarta [6988] 'Granos' (1 kg) = 800 und
UPDATE inventory SET qnty = 0 WHERE product_id IN (6988);
UPDATE products  SET deleted_at = now(), merged_into = 180 WHERE id IN (6988);

-- CONSERVA [31] 'Café' (200 gr) = 60 und
--   descarta [118] 'cafe' (250gr) = 60 und
UPDATE inventory SET qnty = 0 WHERE product_id IN (118);
UPDATE products  SET deleted_at = now(), merged_into = 31 WHERE id IN (118);

-- ── 2. Duplicados exactos, todos con stock 0 ──  30 filas.
-- Ej.: 'Pasta 125 gr'/'Pasta 125g', 'Macro gotero'/'Macrogotero'.
--   [95] 'arroz' (500g) → [93] 'arroz'
--   [124] 'cafe' (50gr) → [122] 'Café'
--   [257] 'Pasta' (125g) → [256] 'Pasta'
--   [453] 'Crema de bebe' (s/m) → [310] 'Crema para bebé'
--   [364] 'Pañal de bebé talla P' (24 und) → [363] 'Pañal de bebe talla P'
--   [550] 'Toallas húmedas de' (24 und) → [540] 'toallas humedas'
--   … y 24 más
UPDATE products SET deleted_at = now(), merged_into = 93 WHERE id = 95;
UPDATE products SET deleted_at = now(), merged_into = 122 WHERE id = 124;
UPDATE products SET deleted_at = now(), merged_into = 256 WHERE id = 257;
UPDATE products SET deleted_at = now(), merged_into = 310 WHERE id = 453;
UPDATE products SET deleted_at = now(), merged_into = 363 WHERE id = 364;
UPDATE products SET deleted_at = now(), merged_into = 540 WHERE id = 550;
UPDATE products SET deleted_at = now(), merged_into = 543 WHERE id = 551;
UPDATE products SET deleted_at = now(), merged_into = 603 WHERE id = 605;
UPDATE products SET deleted_at = now(), merged_into = 646 WHERE id = 764;
UPDATE products SET deleted_at = now(), merged_into = 666 WHERE id = 788;
UPDATE products SET deleted_at = now(), merged_into = 707 WHERE id = 709;
UPDATE products SET deleted_at = now(), merged_into = 707 WHERE id = 719;
UPDATE products SET deleted_at = now(), merged_into = 762 WHERE id = 954;
UPDATE products SET deleted_at = now(), merged_into = 768 WHERE id = 1028;
UPDATE products SET deleted_at = now(), merged_into = 769 WHERE id = 792;
UPDATE products SET deleted_at = now(), merged_into = 894 WHERE id = 896;
UPDATE products SET deleted_at = now(), merged_into = 1053 WHERE id = 1054;
UPDATE products SET deleted_at = now(), merged_into = 1180 WHERE id = 1398;
UPDATE products SET deleted_at = now(), merged_into = 1207 WHERE id = 1208;
UPDATE products SET deleted_at = now(), merged_into = 1210 WHERE id = 1211;
UPDATE products SET deleted_at = now(), merged_into = 1212 WHERE id = 1213;
UPDATE products SET deleted_at = now(), merged_into = 1212 WHERE id = 1215;
UPDATE products SET deleted_at = now(), merged_into = 1225 WHERE id = 1229;
UPDATE products SET deleted_at = now(), merged_into = 1237 WHERE id = 1241;
UPDATE products SET deleted_at = now(), merged_into = 1269 WHERE id = 1270;
UPDATE products SET deleted_at = now(), merged_into = 1301 WHERE id = 1302;
UPDATE products SET deleted_at = now(), merged_into = 1306 WHERE id = 1308;
UPDATE products SET deleted_at = now(), merged_into = 1344 WHERE id = 1345;
UPDATE products SET deleted_at = now(), merged_into = 1462 WHERE id = 1472;
UPDATE products SET deleted_at = now(), merged_into = 1532 WHERE id = 1540;

-- ── 3. Filas semilla con medida duplicada '(2)' ──  4 filas.
-- Apuntan a su hermano legítimo (la misma medida sin el sufijo).
UPDATE products SET deleted_at = now(), merged_into = 93 WHERE id = 94;  -- Arroz '500 gr (2)' → '500 gr'
UPDATE products SET deleted_at = now(), merged_into = 193 WHERE id = 194;  -- Harina de trigo '900 gr (2)' → '900 gr'
UPDATE products SET deleted_at = now(), merged_into = 216 WHERE id = 217;  -- Lentejas '250 gr (2)' → '250 gr'
UPDATE products SET deleted_at = now(), merged_into = 382 WHERE id = 429;  -- Pañal de bebe talla XG '50 und (2)' → '50 und'

-- ── 4. Categorías mal asignadas ──
UPDATE products SET type = 'limpieza'::product_type WHERE id = 35;  -- Cloro Galon
UPDATE products SET type = 'limpieza'::product_type WHERE id = 37;  -- Desinfectante Galon
UPDATE products SET type = 'higiene'::product_type WHERE id = 162;  -- Desodorante de Sobre

-- ── 5. Verificación por DELTA: deben desaparecer exactamente 6460 unidades ──
DO $$
DECLARE v_antes INTEGER; v_despues INTEGER; n INTEGER;
BEGIN
  SELECT total INTO v_antes FROM _antes;
  SELECT COALESCE(SUM(i.qnty),0) INTO v_despues
    FROM inventory i JOIN products p ON p.id = i.product_id
   WHERE p.deleted_at IS NULL;
  SELECT count(*) INTO n FROM products WHERE deleted_at IS NULL;

  IF v_antes - v_despues <> 6460 THEN
    RAISE EXCEPTION 'Delta inesperado: % (se esperaba 6460). Se revierte todo.',
      v_antes - v_despues;
  END IF;
  RAISE NOTICE 'OK · % → % unidades (-%) · % productos vivos',
    v_antes, v_despues, 6460, n;
END $$;

COMMIT;


-- ============================================================
-- 6. Blindaje: impedir que vuelvan a crearse duplicados exactos
-- ============================================================
-- No se usa la extensión unaccent: en Supabase vive en el esquema
-- "extensions" y además es STABLE, no IMMUTABLE, así que no sirve
-- para indexar. translate() es IMMUTABLE y no necesita extensión.
-- Se conserva el punto: '1.5 lt' y '15 lt' NO deben colisionar.
CREATE OR REPLACE FUNCTION public.norm_txt(t TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT regexp_replace(
           translate(lower(t), 'áéíóúüñàèìòùâêîôûç', 'aeiouunaeiouaeiouc'),
           '[^a-z0-9.]+', '', 'g');
$$;

-- ⚠ NO ACTIVAR TODAVÍA.
-- El índice haría que un insumo duplicado devuelva 409 en el upsert. Hoy
-- _isPermanent(409) es true en sync.js, así que el cliente lo borraría de la
-- cola en silencio; después apply_count fallaría con "Producto no existe" y
-- también descartaría el conteo. Cambiaríamos "aparecen duplicados" por
-- "se pierden conteos sin avisar".
--
-- Actívalo cuando el cliente sepa reaccionar al 409 (fusionar contra el
-- insumo existente en vez de descartar). Comprobado: hoy no colisiona.
--
-- CREATE UNIQUE INDEX products_norm_uniq
--   ON products (norm_txt(name), norm_txt(unidad))
--   WHERE deleted_at IS NULL;
