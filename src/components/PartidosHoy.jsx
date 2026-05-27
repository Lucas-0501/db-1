import { useEffect, useState } from 'react'
import { getMatchesHoy, mapEstado } from '../lib/apifootball'

export default function PartidosHoy({ onSelectPartido }) {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getMatchesHoy()
      .then(setPartidos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />
  if (error)   return <p className="text-red-600 text-center py-8 text-sm">{error}</p>

  if (!partidos.length) return (
    <div className="text-center py-12 glass-light rounded-2xl">
      <p className="text-[#013535] font-semibold text-lg">No hay partidos hoy.</p>
      <p className="text-[#024a4a] text-sm mt-1">Explorá las ligas en la parte superior para ver resultados y posiciones.</p>
    </div>
  )

  // Agrupar por competencia
  const porLiga = partidos.reduce((acc, p) => {
    const key = p.league.competition || 'Otras'
    if (!acc[key]) acc[key] = { nombre: p.league.nombre, emblem: p.league.emblem, partidos: [] }
    acc[key].partidos.push(p)
    return acc
  }, {})

  // Primero los que tienen partidos en vivo o en curso
  const ordenados = Object.entries(porLiga).sort(([, a], [, b]) => {
    const vivos = (lista) => lista.partidos.some((p) => ['1H', 'HT'].includes(p.fixture.status.short))
    return vivos(b) - vivos(a)
  })

  return (
    <div className="relative w-full">
      
      {/* Contenedor Izquierdo (Fondo Pixeles + Haaland) */}
      <div className="hidden xl:block absolute -left-[450px] top-0 w-[450px] h-[600px] z-0">
        {/* Patrón de Pixeles (Mosaic) */}
        <div className="absolute inset-0 w-full h-full opacity-60"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='40' height='40' fill='rgba(255,255,255,0.15)'/%3E%3Crect x='40' width='40' height='40' fill='rgba(255,255,255,0.05)'/%3E%3Crect y='40' width='40' height='40' fill='rgba(255,255,255,0.2)'/%3E%3Crect x='40' y='40' width='40' height='40' fill='rgba(255,255,255,0.3)'/%3E%3Crect x='20' y='20' width='40' height='40' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
               WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)',
               maskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)'
             }}>
        </div>
        {/* Jugador */}
        <img 
          src="/haaland.png" 
          alt="Haaland" 
          className="absolute bottom-0 right-0 w-[400px] h-auto object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105"
          style={{ 
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', 
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' 
          }}
        />
      </div>

      {/* Contenedor Central de Partidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 relative z-10">
        {ordenados.map(([code, liga]) => (
          <div key={code} className="glass-light rounded-3xl overflow-hidden flex flex-col shadow-lg">
            <div className="px-5 py-3 glass-dark flex items-center gap-3">
              {liga.emblem && (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 shrink-0">
                  <img src={liga.emblem} className="w-full h-full object-contain" alt="" />
                </div>
              )}
              <h3 className="text-white font-bold text-sm tracking-wide">
                {liga.nombre}
              </h3>
            </div>
            <div className="divide-y divide-gray-200/50 flex-grow bg-white/40 backdrop-blur-md">
              {liga.partidos.map((p) => (
                <PartidoRow key={p.fixture.id} p={p} onSelect={onSelectPartido} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor Derecho (Fondo Pixeles + Mbappe) */}
      <div className="hidden xl:block absolute -right-[400px] top-0 w-[400px] h-[600px] z-0">
        {/* Patrón de Pixeles (Mosaic) */}
        <div className="absolute inset-0 w-full h-full opacity-60"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='40' height='40' fill='rgba(255,255,255,0.15)'/%3E%3Crect x='40' width='40' height='40' fill='rgba(255,255,255,0.05)'/%3E%3Crect y='40' width='40' height='40' fill='rgba(255,255,255,0.2)'/%3E%3Crect x='40' y='40' width='40' height='40' fill='rgba(255,255,255,0.3)'/%3E%3Crect x='20' y='20' width='40' height='40' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
               WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)',
               maskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)'
             }}>
        </div>
        {/* Jugador */}
        <img 
          src="/mbappe.png" 
          alt="Mbappe" 
          className="absolute bottom-0 left-0 w-[350px] h-auto object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105"
          style={{ 
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', 
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' 
          }}
        />
      </div>
      
    </div>
  )
}

function PartidoRow({ p, onSelect }) {
  const { texto, vivo } = mapEstado(p.fixture.status.short, p.fixture.status.elapsed)
  const golesLocal = p.goals.home ?? '-'
  const golesVisit = p.goals.away ?? '-'
  const hora = new Date(p.fixture.date).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires',
  })

  return (
    <button
      onClick={() => onSelect(p.fixture.id)}
      className="w-full px-5 py-4 hover:bg-white/40 transition-colors group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-gray-900 font-semibold text-sm text-right leading-tight group-hover:text-[#013535]">
            {p.teams.home.name}
          </span>
          <img src={p.teams.home.logo} className="w-8 h-8 object-contain shrink-0 drop-shadow-sm" alt="" />
        </div>

        <div className="flex flex-col items-center min-w-[90px] shrink-0">
          {p.fixture.status.short === 'NS' ? (
            <span className="text-[#024a4a] text-sm font-bold">{hora}</span>
          ) : (
            <span className="text-[#013535] font-black text-2xl tabular-nums tracking-tighter">
              {golesLocal} – {golesVisit}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1 ${
            vivo
              ? 'bg-red-500 text-white animate-pulse shadow-md'
              : p.fixture.status.short === 'FT'
                ? 'bg-gray-200 text-gray-700'
                : 'bg-[#013535] text-white'
          }`}>
            {texto}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-start">
          <img src={p.teams.away.logo} className="w-8 h-8 object-contain shrink-0 drop-shadow-sm" alt="" />
          <span className="text-gray-900 font-semibold text-sm text-left leading-tight group-hover:text-[#013535]">
            {p.teams.away.name}
          </span>
        </div>
      </div>
    </button>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-light rounded-3xl overflow-hidden animate-pulse flex flex-col">
          <div className="px-5 py-4 glass-dark h-12" />
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex justify-between items-center px-5 py-5 border-b border-gray-200/50">
              <div className="h-4 bg-gray-300 rounded w-1/4" />
              <div className="h-8 bg-gray-300 rounded w-16" />
              <div className="h-4 bg-gray-300 rounded w-1/4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
