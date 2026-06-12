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
    <div className="text-center py-16 bg-white border border-black/5 shadow-sm rounded-[2rem]">
      <p className="text-zinc-800 font-bold text-xl">No hay partidos destacados hoy.</p>
      <p className="text-zinc-500 text-sm mt-2 font-medium">Explorá las ligas en la parte superior para ver resultados y posiciones.</p>
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
    <div className="relative w-full min-h-[600px]">
      
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
          className="absolute bottom-16 right-0 w-[400px] h-auto object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105"
          style={{ 
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', 
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' 
          }}
        />
      </div>

      {/* Contenedor Central de Partidos */}
      <div className="max-w-4xl mx-auto w-full flex flex-col space-y-8 relative z-10">
        {ordenados.map(([code, liga], i) => (
          <div key={code} className="stitch-card flex flex-col p-8 animate-stagger-fade" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex flex-col flex-grow">
              <div className="pb-6 border-b border-black/5 flex items-center gap-4">
                {liga.emblem && (
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center p-1.5 border border-black/5 shrink-0">
                    <img src={liga.emblem} className="w-full h-full object-contain" alt="" />
                  </div>
                )}
                <h3 className="text-zinc-900 font-bold text-sm tracking-wide">
                  {liga.nombre}
                </h3>
              </div>
              <div className="divide-y divide-black/5 flex-grow bg-white mt-2">
                {liga.partidos.map((p) => (
                  <PartidoRow key={p.fixture.id} p={p} onSelect={onSelectPartido} />
                ))}
              </div>
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
          className="absolute bottom-16 left-0 w-[350px] h-auto object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105"
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
      className="w-full px-6 py-5 hover:bg-zinc-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:bg-zinc-100 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-zinc-600 font-bold text-sm text-right leading-tight group-hover:text-zinc-900 transition-colors">
            {p.teams.home.name}
          </span>
          <img src={p.teams.home.logo} className="w-8 h-8 object-contain shrink-0" alt="" />
        </div>

        <div className="flex flex-col items-center min-w-[90px] shrink-0">
          {p.fixture.status.short === 'NS' ? (
            <span className="text-zinc-400 text-sm font-bold tabular-nums">{hora}</span>
          ) : (
            <span className="text-zinc-900 font-black text-3xl tabular-nums tracking-tighter leading-none">
              {golesLocal} – {golesVisit}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2 ${
            vivo
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'
              : p.fixture.status.short === 'FT'
                ? 'bg-zinc-100 text-zinc-500'
                : 'bg-zinc-50 text-zinc-700 border border-black/5'
          }`}>
            {texto}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-start">
          <img src={p.teams.away.logo} className="w-8 h-8 object-contain shrink-0" alt="" />
          <span className="text-zinc-600 font-bold text-sm text-left leading-tight group-hover:text-zinc-900 transition-colors">
            {p.teams.away.name}
          </span>
        </div>
      </div>
    </button>
  )
}

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-8">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="stitch-card animate-pulse flex flex-col p-6">
          <div className="flex flex-col flex-grow">
            <div className="pb-4 border-b border-black/5 flex items-center">
              <div className="h-6 w-24 bg-zinc-200 rounded" />
            </div>
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex justify-between items-center px-6 py-6 border-b border-black/5">
                <div className="h-4 bg-zinc-100 rounded w-1/4" />
                <div className="h-10 bg-zinc-200 rounded w-16" />
                <div className="h-4 bg-zinc-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
