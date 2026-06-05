# Conexión y Gestión de Endpoints (Supabase y API Externa)

Este documento detalla la arquitectura de integración y el consumo de endpoints en el proyecto **FutScore**, explicando cómo se conecta el Frontend (React) tanto con la API externa de fútbol como con la base de datos de Supabase.

---

## 1. Consumo de la API Externa (Football-Data)

Para obtener los datos en tiempo real de los partidos (resultados, escudos, ligas, estados), el proyecto consume la API REST de [football-data.org](https://www.football-data.org/).

### 1.1 Configuración del Endpoint
La conexión está centralizada en el archivo `src/lib/apifootball.js`. Se utiliza la función nativa `fetch` de JavaScript para realizar las peticiones HTTP (GET) hacia la API.

- **Autenticación:** La API requiere de una clave privada. Esta se almacena como variable de entorno (`VITE_FOOTBALL_DATA_KEY`) para mantenerla segura y no exponerla en el código fuente.
- **Headers:** En cada petición, la clave se inyecta en el encabezado `X-Auth-Token`.

```javascript
const API_KEY = import.meta.env.VITE_FOOTBALL_DATA_KEY;
const BASE_URL = '/football-api'; // Proxy configurado para evitar errores de CORS

async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  return res.json();
}
```

### 1.2 Normalización de Datos
Como la estructura de respuesta de la API externa es compleja, se implementó una función `normalizarPartido()` que procesa el JSON crudo y lo convierte en un formato estándar más sencillo para que los componentes de React lo consuman sin problemas.

---

## 2. Conexión con Supabase (Backend as a Service)

Supabase actúa como nuestra base de datos relacional (PostgreSQL) y proveedor de autenticación. La conexión oficial está en `src/lib/supabase.js`.

### 2.1 Inicialización del Cliente
Utilizamos la librería oficial `@supabase/supabase-js`. Para instanciar el cliente, le pasamos la URL del proyecto de Supabase y la clave pública (Anon Key), ambas guardadas en variables de entorno.

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2.2 Endpoints de Autenticación
Supabase expone sus propios endpoints a través de los métodos de su SDK.
- **Registro:** `supabase.auth.signUp()`
- **Inicio de Sesión:** `supabase.auth.signInWithPassword()`
- **Cierre de Sesión:** `supabase.auth.signOut()`

*Nota:* Al momento de crear el usuario, un Trigger en PostgreSQL (`handle_new_user`) se encarga automáticamente de insertar los datos en nuestra tabla pública `usuario`.

### 2.3 Operaciones CRUD sobre la Base de Datos
El cliente de Supabase traduce nuestros comandos en JavaScript a peticiones a su API REST (PostgREST), la cual ejecuta consultas SQL de forma segura.

Ejemplos clave en el proyecto:

1. **Lectura (GET): Obtener Partidos y Predicciones**
   Se utiliza el método `.select()`. En la función `getPartidosProde`, se realiza una consulta para traer los partidos activos y, a su vez, buscar las predicciones que hizo el usuario actual para cruzarlas en la interfaz.

2. **Escritura y Actualización (UPSERT): Guardar Predicciones**
   Cuando un usuario carga un resultado en el Prode, se usa el método `.upsert()`. Esto significa que si la predicción no existe, se inserta; si ya existe (basado en la restricción `UNIQUE` de `usuario_id, partido_id`), se actualiza.

```javascript
export async function guardarPrediccion(userId, partidoId, golesLocal, golesVisitante) {
  const { data, error } = await supabase
    .from('prediccion')
    .upsert({ 
      usuario_id: userId, 
      partido_id: partidoId, 
      goles_local_predichos: golesLocal, 
      goles_visitante_predichos: golesVisitante 
    }, { 
      onConflict: 'usuario_id, partido_id' 
    });
  return data;
}
```

---

## 3. Sincronización (El Puente entre la API Externa y Supabase)

El punto más fuerte de la arquitectura es cómo los datos de la API de fútbol llegan a nuestra base de datos para que el Prode pueda funcionar de forma automática. 

Para lograrlo, se diseñó la función `sincronizarPartidos(partidosApi)` en `supabase.js`:

1. El Frontend hace una petición `fetch` a la API externa para ver los resultados de los partidos de hoy.
2. Esos datos se pasan por parámetro a `sincronizarPartidos()`.
3. La función formatea el "estado" de los partidos (Ej: de "LIVE" de la API a "en_curso" en la DB).
4. Hace un **Upsert masivo** en la tabla `partido` de Supabase usando el ID del partido de la API externa (`api_fixture_id`) como clave de conflicto.

**¿Qué pasa después?**
Una vez que el estado del partido en Supabase pasa a `"finalizado"`, la base de datos toma el control total. Se dispara automáticamente el **Trigger de PostgreSQL (`trg_actualizar_puntos`)**, el cual calcula los puntos de cada jugador de forma autónoma sin depender de JavaScript, garantizando integridad matemática y seguridad contra trampas.
