-- SCHEMA: Fantasy / Prode de Fútbol - Base de Datos 1
-- Universidad de Belgrano - Ingeniería en Informática

DROP VIEW IF EXISTS vista_ranking;
DROP TABLE IF EXISTS prediccion, partido, usuario CASCADE;
DROP FUNCTION IF EXISTS calcular_puntos_prediccion CASCADE;

-- 1. Tabla de Usuarios (Jugadores del Prode)
CREATE TABLE usuario (
    id             UUID PRIMARY KEY, -- Se vincula con auth.users.id
    username       VARCHAR(50) NOT NULL UNIQUE,
    email          VARCHAR(150) NOT NULL UNIQUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    puntos_totales INT DEFAULT 0
);

-- 2. Tabla de Partidos (Fuente de la verdad)
-- Esta tabla se sincroniza con la API de fútbol (ej. cuando termina un partido)
CREATE TABLE partido (
    id                     SERIAL PRIMARY KEY,
    api_fixture_id         INT UNIQUE NOT NULL, -- El ID que viene de api.football-data.org
    liga                   VARCHAR(100),
    equipo_local           VARCHAR(100) NOT NULL,
    escudo_local           TEXT,
    equipo_visitante       VARCHAR(100) NOT NULL,
    escudo_visitante       TEXT,
    goles_local_reales     SMALLINT, -- Nulo hasta que termine el partido
    goles_visitante_reales SMALLINT,
    fecha                  TIMESTAMPTZ NOT NULL,
    estado                 VARCHAR(20) NOT NULL DEFAULT 'programado'
                               CHECK (estado IN ('programado', 'en_curso', 'finalizado'))
);

-- 3. Tabla de Predicciones (El Prode de los usuarios)
CREATE TABLE prediccion (
    id                        SERIAL PRIMARY KEY,
    usuario_id                UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    partido_id                INT NOT NULL REFERENCES partido(id) ON DELETE CASCADE,
    goles_local_predichos     SMALLINT NOT NULL,
    goles_visitante_predichos SMALLINT NOT NULL,
    puntos_obtenidos          SMALLINT DEFAULT 0,
    fecha_prediccion          TIMESTAMPTZ DEFAULT NOW(),
    -- Restricción clave: Un usuario no puede predecir dos veces el mismo partido
    CONSTRAINT uq_usuario_partido UNIQUE (usuario_id, partido_id)
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_prediccion_usuario ON prediccion(usuario_id);
CREATE INDEX idx_prediccion_partido ON prediccion(partido_id);
CREATE INDEX idx_partido_estado     ON partido(estado);


-- =========================================================================
-- LÓGICA DE NEGOCIO EN LA BASE DE DATOS (REQUISITO CLAVE PARA BD1)
-- =========================================================================

-- Función para calcular los puntos cuando un partido finaliza
CREATE OR REPLACE FUNCTION calcular_puntos_prediccion()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo nos importa si el partido acaba de cambiar a estado 'finalizado'
    IF NEW.estado = 'finalizado' AND OLD.estado != 'finalizado' THEN
        
        -- Actualizamos los puntos de todas las predicciones para este partido
        UPDATE prediccion
        SET puntos_obtenidos = 
            CASE 
                -- 3 Puntos: Acierto exacto del resultado
                WHEN goles_local_predichos = NEW.goles_local_reales 
                 AND goles_visitante_predichos = NEW.goles_visitante_reales 
                THEN 3
                
                -- 1 Punto: Acertó quién gana o si es empate, pero no el resultado exacto
                WHEN (goles_local_predichos > goles_visitante_predichos AND NEW.goles_local_reales > NEW.goles_visitante_reales) OR
                     (goles_local_predichos < goles_visitante_predichos AND NEW.goles_local_reales < NEW.goles_visitante_reales) OR
                     (goles_local_predichos = goles_visitante_predichos AND NEW.goles_local_reales = NEW.goles_visitante_reales)
                THEN 1
                
                -- 0 Puntos: No acertó nada
                ELSE 0
            END
        WHERE partido_id = NEW.id;

        -- Actualizar los puntos totales de los usuarios (sumando los obtenidos)
        UPDATE usuario u
        SET puntos_totales = (
            SELECT COALESCE(SUM(puntos_obtenidos), 0)
            FROM prediccion
            WHERE usuario_id = u.id
        )
        WHERE u.id IN (
            SELECT usuario_id FROM prediccion WHERE partido_id = NEW.id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara automáticamente después de actualizar un partido
CREATE TRIGGER trg_actualizar_puntos
AFTER UPDATE OF estado, goles_local_reales, goles_visitante_reales ON partido
FOR EACH ROW
EXECUTE FUNCTION calcular_puntos_prediccion();


-- =========================================================================
-- VISTAS (VIEWS)
-- =========================================================================

-- Vista para mostrar el Ranking General del Prode
CREATE OR REPLACE VIEW vista_ranking AS
SELECT 
    u.username,
    u.puntos_totales AS puntaje_total,
    COUNT(p.id) AS cantidad_predicciones,
    SUM(CASE WHEN p.puntos_obtenidos = 3 THEN 1 ELSE 0 END) AS aciertos_exactos
FROM 
    usuario u
LEFT JOIN 
    prediccion p ON u.id = p.usuario_id
GROUP BY 
    u.id, u.username, u.puntos_totales
ORDER BY 
    puntaje_total DESC, aciertos_exactos DESC;


-- =========================================================================
-- INTEGRACIÓN CON SUPABASE AUTH (Login / Registro)
-- =========================================================================

-- Esta función se dispara automáticamente cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuario (id, email, username)
  VALUES (
      new.id, 
      new.email, 
      -- Usamos el email antes del @ como username si no viene en los metadatos
      COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que escucha la creación de nuevos usuarios en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Desactivar Row Level Security (RLS) para que la app lea/escriba sin problemas durante la demo
ALTER TABLE usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE partido DISABLE ROW LEVEL SECURITY;
ALTER TABLE prediccion DISABLE ROW LEVEL SECURITY;
