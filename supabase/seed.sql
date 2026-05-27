-- SEED: Datos de prueba para el Fantasy / Prode
-- Este script inserta usuarios de prueba, algunos partidos y sus predicciones

-- 1. Insertar Usuarios
INSERT INTO usuario (id, username, email, puntos_totales) VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Mati_Gamer', 'mati@example.com', 0),
    ('f6e5d4c3-b2a1-0d9c-8b7a-6f5e4d3c2b1a', 'ProdeMaster', 'prode@example.com', 0),
    ('11223344-5566-7788-9900-aabbccddeeff', 'Futbolero99', 'futbolero@example.com', 0);

-- 2. Insertar Partidos (usamos IDs ficticios similares a la API para la demo)
INSERT INTO partido (id, api_fixture_id, equipo_local, equipo_visitante, goles_local_reales, goles_visitante_reales, fecha, estado) VALUES
    (1, 1001, 'River Plate', 'Boca Juniors', 2, 1, '2026-05-20 20:00:00-03', 'finalizado'),
    (2, 1002, 'Racing Club', 'Independiente', 1, 1, '2026-05-21 17:00:00-03', 'finalizado'),
    (3, 1003, 'San Lorenzo', 'Huracán', NULL, NULL, '2026-05-25 15:30:00-03', 'programado'),
    (4, 1004, 'Manchester City', 'Arsenal', 3, 0, '2026-05-20 16:00:00-03', 'finalizado'),
    (5, 1005, 'Real Madrid', 'Barcelona', NULL, NULL, '2026-05-26 16:00:00-03', 'programado');

-- Sincronizar el contador de secuencia de partidos
SELECT setval('partido_id_seq', 5);

-- 3. Insertar Predicciones
-- Partido 1: River 2 - Boca 1
INSERT INTO prediccion (usuario_id, partido_id, goles_local_predichos, goles_visitante_predichos) VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 1, 2, 1), -- Mati_Gamer: Acierto exacto (3 pts)
    ('f6e5d4c3-b2a1-0d9c-8b7a-6f5e4d3c2b1a', 1, 1, 0), -- ProdeMaster: Acierto ganador (1 pt)
    ('11223344-5566-7788-9900-aabbccddeeff', 1, 0, 2); -- Futbolero99: Falla (0 pts)

-- Partido 2: Racing 1 - Independiente 1
INSERT INTO prediccion (usuario_id, partido_id, goles_local_predichos, goles_visitante_predichos) VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 2, 2, 1), -- Mati_Gamer: Falla (0 pts)
    ('f6e5d4c3-b2a1-0d9c-8b7a-6f5e4d3c2b1a', 2, 0, 0), -- ProdeMaster: Acierto empate (1 pt)
    ('11223344-5566-7788-9900-aabbccddeeff', 2, 1, 1); -- Futbolero99: Acierto exacto (3 pts)

-- Partido 4: City 3 - Arsenal 0
INSERT INTO prediccion (usuario_id, partido_id, goles_local_predichos, goles_visitante_predichos) VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 4, 3, 0), -- Mati_Gamer: Acierto exacto (3 pts)
    ('f6e5d4c3-b2a1-0d9c-8b7a-6f5e4d3c2b1a', 4, 2, 0), -- ProdeMaster: Acierto ganador (1 pt)
    ('11223344-5566-7788-9900-aabbccddeeff', 4, 1, 1); -- Futbolero99: Falla (0 pts)

-- Partido 3 y 5: Programados (Aún no tienen puntos calculados)
INSERT INTO prediccion (usuario_id, partido_id, goles_local_predichos, goles_visitante_predichos) VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 3, 2, 0),
    ('f6e5d4c3-b2a1-0d9c-8b7a-6f5e4d3c2b1a', 3, 1, 1),
    ('11223344-5566-7788-9900-aabbccddeeff', 5, 2, 2);

-- Nota: Como insertamos partidos finalizados directamente, el trigger NO se ejecutó 
-- (porque el trigger actúa cuando *cambia* a estado finalizado).
-- Para que se calculen los puntos iniciales de la DB de prueba, forzamos un UPDATE:

UPDATE partido SET estado = 'en_curso' WHERE estado = 'finalizado';
UPDATE partido SET estado = 'finalizado' WHERE estado = 'en_curso';

-- Después de este script, el ranking de la vista 'vista_ranking' será:
-- 1. Mati_Gamer: 6 pts (dos aciertos exactos)
-- 2. Futbolero99: 3 pts (un acierto exacto)
-- 3. ProdeMaster: 3 pts (tres aciertos de resultado)
