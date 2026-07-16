const API_KEY = import.meta.env.VITE_FOOTBALL_DATA_KEY
const BASE_URL = '/football-api'

export const COMPETITIONS = [
  { code: 'PL',  nombre: 'Premier League',  pais: 'Inglaterra',   emblem: 'https://crests.football-data.org/PL.png' },
  { code: 'BL1', nombre: 'Bundesliga',      pais: 'Alemania',     emblem: 'https://crests.football-data.org/BL1.png' },
  { code: 'PD',  nombre: 'La Liga',         pais: 'España',       emblem: 'https://crests.football-data.org/PD.png' },
  { code: 'SA',  nombre: 'Serie A',         pais: 'Italia',       emblem: 'https://crests.football-data.org/SA.png' },
  { code: 'FL1', nombre: 'Ligue 1',         pais: 'Francia',      emblem: 'https://crests.football-data.org/FL1.png' },
  { code: 'DED', nombre: 'Eredivisie',      pais: 'Países Bajos', emblem: 'https://crests.football-data.org/ED.png' },
  { code: 'PPL', nombre: 'Primeira Liga',   pais: 'Portugal',     emblem: 'https://crests.football-data.org/PPL.png' },
  { code: 'CL',  nombre: 'Champions League',pais: 'Europa',       emblem: 'https://crests.football-data.org/CL.png' },
  { code: 'EC',  nombre: 'Eurocopa',        pais: 'Europa',       emblem: 'https://crests.football-data.org/EUR.svg' },
  { code: 'WC',  nombre: 'Mundial',         pais: 'Mundo',        emblem: 'https://crests.football-data.org/qatar.png' },
]

async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error HTTP ${res.status}`)
  }
  return res.json()
}

function mapStatusShort(status) {
  switch (status) {
    case 'FINISHED':
    case 'AWARDED':   return 'FT'
    case 'LIVE':
    case 'IN_PLAY':
    case 'EXTRA_TIME':
    case 'PENALTY_SHOOTOUT': return '1H'
    case 'PAUSED':    return 'HT'
    case 'TIMED':
    case 'SCHEDULED': return 'NS'
    case 'POSTPONED': return 'PST'
    case 'CANCELLED':
    case 'SUSPENDED': return 'CANC'
    default:          return status
  }
}

function normalizarPartido(m) {
  let statusShort = mapStatusShort(m.status)
  
  // Sanity check: Si el partido empezó hace más de 4 horas, forzar a finalizado
  // Esto soluciona el problema de partidos que quedan trabados en "EN VIVO" por la API
  if (m.utcDate) {
    const matchDate = new Date(m.utcDate)
    const now = new Date()
    const diffHours = (now - matchDate) / (1000 * 60 * 60)
    
    // Si pasaron más de 4 horas y sigue marcado como en curso, lo forzamos a FT
    if (diffHours > 4 && ['1H', 'HT'].includes(statusShort)) {
      statusShort = 'FT'
    }
  }

  return {
    fixture: {
      id:     m.id,
      date:   m.utcDate,
      status: { short: statusShort, elapsed: m.minute ?? null },
    },
    league: {
      round:       m.matchday ? `Fecha ${m.matchday}` : (m.stage ?? 'Sin fecha'),
      competition: m.competition?.code   ?? '',
      nombre:      m.competition?.name   ?? '',
      emblem:      m.competition?.emblem ?? null,
    },
    teams: {
      home: { id: m.homeTeam?.id, name: m.homeTeam?.name || m.homeTeam?.shortName || 'Por definir', logo: m.homeTeam?.crest },
      away: { id: m.awayTeam?.id, name: m.awayTeam?.name || m.awayTeam?.shortName || 'Por definir', logo: m.awayTeam?.crest },
    },
    goals: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
  }
}

function normalizarGoles(match) {
  if (!Array.isArray(match.goals)) return []
  return match.goals.map((g) => ({
    type:   'Goal',
    time:   { elapsed: g.minute ?? '?' },
    team:   { id: g.team?.id },
    player: { name: g.scorer?.name ?? 'Desconocido' },
    detail: g.type === 'PENALTY'  ? 'Penalty'
          : g.type === 'OWN_GOAL' ? 'Own Goal'
          : 'Normal Goal',
  }))
}

// Todos los partidos de hoy (todas las competencias del plan gratuito)
export async function getMatchesHoy() {
  // Pedimos desde ayer hasta mañana para tener más contenido (partidos recientes y próximos)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const fDesde = ayer.toISOString().split('T')[0]
  const fHasta = manana.toISOString().split('T')[0]

  let data
  let dataWC
  
  try {
    const results = await Promise.all([
      apiFetch(`/matches?dateFrom=${fDesde}&dateTo=${fHasta}`),
      apiFetch(`/competitions/WC/matches`).catch(() => ({ matches: [] }))
    ])
    data = results[0]
    dataWC = results[1]
  } catch (error) {
    throw error
  }

  // Devolvemos todos (ayer, hoy y mañana)
  const matchesNormalizados = data.matches.map(normalizarPartido)

  // Agregar la final y el 3er puesto del mundial si no están
  if (dataWC && dataWC.matches) {
    const wcFinals = dataWC.matches.filter(m => m.stage === 'FINAL' || m.stage === 'THIRD_PLACE')
    wcFinals.forEach(wcf => {
      const isIncluded = matchesNormalizados.find(m => m.fixture.id === wcf.id)
      if (!isIncluded) {
        matchesNormalizados.push(normalizarPartido(wcf))
      }
    })
  }

  return matchesNormalizados
}

export async function getAllMatches(competition) {
  const data = await apiFetch(`/competitions/${competition}/matches`)
  return data.matches.map(normalizarPartido)
}

export async function getFixturasHoy(competition) {
  const hoy = new Date().toISOString().split('T')[0]
  const data = await apiFetch(`/competitions/${competition}/matches?dateFrom=${hoy}&dateTo=${hoy}`)
  return data.matches.map(normalizarPartido)
}

export async function getUltimasFechas(competition, cantidad = 15) {
  const data = await apiFetch(`/competitions/${competition}/matches?status=FINISHED`)
  const sorted = [...data.matches].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
  return sorted.slice(0, cantidad).map(normalizarPartido)
}

export async function getProximosPartidos(competition, cantidad = 10) {
  const data = await apiFetch(`/competitions/${competition}/matches?status=SCHEDULED`)
  const sorted = [...data.matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
  return sorted.slice(0, cantidad).map(normalizarPartido)
}

export async function getStandings(competition) {
  const data  = await apiFetch(`/competitions/${competition}/standings`)
  const totals = data.standings.filter(s => s.type === 'TOTAL')
  
  // Si no hay type TOTAL (raro), agarramos el primero por las dudas
  const groupsToMap = totals.length > 0 ? totals : (data.standings.length > 0 ? [data.standings[0]] : [])

  return groupsToMap.map(g => ({
    groupName: g.group ? g.group.replace('_', ' ') : null,
    table: (g.table || []).map((entry) => ({
      rank:      entry.position,
      goalsDiff: entry.goalDifference,
      team:      { id: entry.team.id, name: entry.team.name, logo: entry.team.crest },
      all: {
        played: entry.playedGames,
        win:    entry.won,
        draw:   entry.draw,
        lose:   entry.lost,
        goals:  { for: entry.goalsFor, against: entry.goalsAgainst },
      },
      points: entry.points,
    }))
  }))
}

export async function getTopScorers(competition) {
  const data = await apiFetch(`/competitions/${competition}/scorers?limit=10`)
  return data.scorers.map((s) => ({
    nombre: s.player.name,
    foto:   s.player.photo ?? null,
    equipo: s.team.name,
    escudo: s.team.crest,
    goles:  s.goals   ?? 0,
    asist:  s.assists ?? 0,
  }))
}

export async function getPartidoDetalle(matchId) {
  const match = await apiFetch(`/matches/${matchId}`)
  return {
    fixture: normalizarPartido(match),
    goles:   normalizarGoles(match),
  }
}

export async function getEventosPartido(matchId) {
  const match = await apiFetch(`/matches/${matchId}`)
  return normalizarGoles(match)
}

export function mapEstado(statusShort, elapsed) {
  if (['FT', 'AET', 'PEN'].includes(statusShort)) return { texto: 'Finalizado', vivo: false }
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(statusShort))
    return { texto: elapsed ? `${elapsed}'` : 'En vivo', vivo: true }
  if (['NS', 'TBD'].includes(statusShort)) return { texto: 'Programado', vivo: false }
  if (statusShort === 'PST') return { texto: 'Postergado', vivo: false }
  if (statusShort === 'CANC') return { texto: 'Cancelado', vivo: false }
  return { texto: statusShort, vivo: false }
}
