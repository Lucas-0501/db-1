import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// AUTENTICACIÓN
// ==========================================

export async function registrarUsuario(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username } // Se enviará al trigger para llenar public.usuario
    }
  })
  if (error) throw error
  return data
}

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar el username en la tabla pública
  const { data, error } = await supabase
    .from('usuario')
    .select('username, puntos_totales')
    .eq('id', user.id)
    .single()
    
  return { ...user, ...data }
}

// ==========================================
// FUNCIONES DE BASE DE DATOS (PRODE)
// ==========================================

// Obtiene la vista de ranking global
export async function getRankingProde() {
  const { data, error } = await supabase
    .from('vista_ranking')
    .select('*')
    // Supabase ordena automáticamente si lo definimos en la vista, 
    // pero podemos forzarlo por las dudas
    .order('puntaje_total', { ascending: false })
    .order('aciertos_exactos', { ascending: false })
  
  if (error) throw error
  return data
}

// Obtiene el historial de predicciones de un usuario específico
export async function getPerfilHistorial(userId) {
  const { data, error } = await supabase
    .from('prediccion')
    .select(`
      goles_local_predichos,
      goles_visitante_predichos,
      puntos_obtenidos,
      fecha_prediccion,
      partido (
        equipo_local,
        equipo_visitante,
        goles_local_reales,
        goles_visitante_reales,
        estado
      )
    `)
    .eq('usuario_id', userId)
    .order('fecha_prediccion', { ascending: false })
    
  if (error) throw error
  return data
}

// Obtiene todos los partidos para la pantalla de "Jugar"
// y hace un LEFT JOIN (implícito con eq y single) para saber si el usuario ya votó
export async function getPartidosProde(userId) {
  // Limpiar partidos viejos (de días anteriores) que quedaron "atascados" en programado
  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: partidos, error: e1 } = await supabase
    .from('partido')
    .select('*')
    .neq('liga', 'Mundial')
    .neq('estado', 'finalizado')
    .gte('fecha', ayer)
    .order('fecha', { ascending: true })

  if (e1) throw e1

  const { data: misPredicciones, error: e2 } = await supabase
    .from('prediccion')
    .select('*')
    .eq('usuario_id', userId)

  if (e2) throw e2

  // Combinar los partidos con la predicción del usuario (si existe)
  return partidos.map(p => {
    const miPrediccion = misPredicciones.find(pred => pred.partido_id === p.id)
    return {
      ...p,
      prediccion_usuario: miPrediccion || null
    }
  })
}

// Guarda o actualiza una predicción en la base de datos
export async function guardarPrediccion(userId, partidoId, golesLocal, golesVisitante) {
  const { data, error } = await supabase
    .from('prediccion')
    .upsert({ 
      usuario_id: userId, 
      partido_id: partidoId, 
      goles_local_predichos: golesLocal, 
      goles_visitante_predichos: golesVisitante 
    }, { 
      onConflict: 'usuario_id, partido_id' // Se basa en la restricción UNIQUE del schema.sql
    })
    
  if (error) throw error
  return data
}

// Obtiene solo los partidos del Mundial y cruza con las predicciones del usuario
export async function getPartidosMundial(userId) {
  const { data: partidos, error: e1 } = await supabase
    .from('partido')
    .select('*')
    .eq('liga', 'Mundial')
    .order('fecha', { ascending: true })

  if (e1) throw e1

  const { data: misPredicciones, error: e2 } = await supabase
    .from('prediccion')
    .select('*')
    .eq('usuario_id', userId)

  if (e2) throw e2

  return partidos.map(p => {
    const miPrediccion = misPredicciones.find(pred => pred.partido_id === p.id)
    return {
      ...p,
      prediccion_usuario: miPrediccion || null
    }
  })
}

// Calcula el ranking exclusivamente para el Mundial
export async function getRankingMundial() {
  const { data, error } = await supabase
    .from('prediccion')
    .select(`
      usuario_id,
      puntos_obtenidos,
      usuario ( username ),
      partido!inner ( liga )
    `)
    .eq('partido.liga', 'Mundial')
    
  if (error) throw error
  
  const rankingMap = {}
  
  data.forEach(pred => {
    const userId = pred.usuario_id
    if (!rankingMap[userId]) {
      rankingMap[userId] = {
        username: pred.usuario.username,
        puntaje_total: 0,
        cantidad_predicciones: 0,
        aciertos_exactos: 0
      }
    }
    
    rankingMap[userId].puntaje_total += pred.puntos_obtenidos
    rankingMap[userId].cantidad_predicciones += 1
    if (pred.puntos_obtenidos === 3) {
      rankingMap[userId].aciertos_exactos += 1
    }
  })
  
  const rankingArray = Object.values(rankingMap)
  rankingArray.sort((a, b) => {
    if (b.puntaje_total !== a.puntaje_total) return b.puntaje_total - a.puntaje_total
    return b.aciertos_exactos - a.aciertos_exactos
  })
  
  return rankingArray
}

// Sincroniza partidos reales desde la API externa hacia Supabase
export async function sincronizarPartidos(partidosApi) {
  if (!partidosApi || partidosApi.length === 0) return []

  const payload = partidosApi.map(p => {
    // Mapeo del estado de la API a nuestro Enum de la base de datos
    const statusShort = p.fixture.status.short
    let estadoDb = 'programado'
    if (['FT', 'AET', 'PEN'].includes(statusShort)) estadoDb = 'finalizado'
    else if (['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(statusShort)) estadoDb = 'en_curso'

    return {
      api_fixture_id: p.fixture.id,
      liga: (p.league.competition === 'WC' || p.league.nombre?.includes('World Cup')) ? 'Mundial' : p.league.nombre,
      equipo_local: p.teams.home.name,
      escudo_local: p.teams.home.logo,
      equipo_visitante: p.teams.away.name,
      escudo_visitante: p.teams.away.logo,
      goles_local_reales: p.goals.home !== null ? p.goals.home : null,
      goles_visitante_reales: p.goals.away !== null ? p.goals.away : null,
      fecha: p.fixture.date,
      estado: estadoDb
    }
  })

  // upsert inserta nuevos o actualiza existentes basados en api_fixture_id
  const { data, error } = await supabase
    .from('partido')
    .upsert(payload, { onConflict: 'api_fixture_id' })
    .select()

  if (error) throw error
  return data
}
