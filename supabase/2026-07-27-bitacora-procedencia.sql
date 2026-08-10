-- ============================================================
-- ⚠️  EJECUTAR EN Supabase → SQL Editor → pegar TODO → Run
-- ============================================================
-- Para: mostrar en la Bitácora de UCVInventario quién autorizó un
-- egreso hecho por comanda (UCVComandas), sin exponer la tabla
-- `comandas` completa (trae PII: cédulas/teléfonos de solicitante,
-- estudiante responsable y conductor, texto crudo de OCR, etc.).
--
-- El rol `anon` (el que usan las 3 apps, sin JWT) NO tiene SELECT
-- sobre `comandas` hoy (confirmado: "permission denied for table
-- comandas"). Esta vista expone SOLO las 5 columnas que la Bitácora
-- necesita para atribuir un movimiento a la comanda que lo generó.
--
-- Idempotente: se puede correr más de una vez sin problema.
-- ============================================================

CREATE OR REPLACE VIEW new_schema_archive.comandas_movement_info AS
SELECT movement_id, origen, autorizado_por, aprobado_por, created_by
FROM new_schema_archive.comandas
WHERE movement_id IS NOT NULL;

GRANT SELECT ON new_schema_archive.comandas_movement_info TO anon;

-- ============================================================
-- Nota: la "Parte 2" que vivía acá (hacer que apply_count guardara
-- received_by/delivered_por) quedó descartada — en su lugar, el área de
-- quien cuenta se arma del lado del cliente como "Nombre · Área" (o
-- "Nombre · Administrador") y viaja directo en movements.note, mismo
-- patrón que ya usaba UCVAcopio (confirmado leyendo su store.js:
-- _actorNote()). Ver js/store.js#_conTag y js/views/registro.js en
-- UCVInventario. No hace falta tocar apply_count para esto.
