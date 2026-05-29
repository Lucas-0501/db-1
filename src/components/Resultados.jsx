import { useEffect, useState } from 'react'
import { getFixturasHoy, getUltimasFechas, getProximosPartidos, mapEstado } from '../lib/apifootball'

export default function Resultados({ competition, onSelectPartido }) {
  const [partidos, setPartidos] = useState([])
  const [titulo, setTitulo]    = useState('')
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPartidos([])

    async function cargar() {
      try {
        let data = await getFixturasHoy(competition)

        if (data.length > 0) {
          setTitulo('Partidos de hoy')
          setPartidos(data)
          return
        }

        const [ultimos, proximos] = await Promise.all([
          getUltimasFechas(competition, 10),
          getProximosPartidos(competition, 5),
        ])

        const combinados = [...proximos.reverse(), ...ultimos]
        setTitulo('Últimos resultados y próximos partidos')
        setPartidos(combinados)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [competition])

  if (loading) return <Skeleton />
  if (error)   return <p className="text-red-600 text-center py-8 text-sm">{error}</p>
  if (!partidos.length) return <p className="text-zinc-500 text-center py-10 font-bold">Sin partidos disponibles.</p>

  const porFecha = partidos.reduce((acc, p) => {
    const round = p.league.round ?? 'Sin fecha'
    if (!acc[round]) acc[round] = []
    acc[round].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-zinc-900 font-bold text-xl px-2">{titulo}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        {Object.entries(porFecha).map(([round, lista], i) => (
          <div key={round} className="stitch-card flex flex-col p-6 animate-stagger-fade" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex flex-col flex-grow">
              <div className="pb-4 border-b border-black/5">
                <h3 className="text-zinc-900 font-bold text-sm uppercase tracking-widest">{round}</h3>
              </div>
              <div className="divide-y divide-black/5 flex-grow mt-2">
              {lista.map((p) => {
                const { texto, vivo } = mapEstado(p.fixture.status.short, p.fixture.status.elapsed)
                const golesLocal = p.goals.home ?? '-'
                const golesVisit = p.goals.away ?? '-'
                const hora = new Date(p.fixture.date).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
                })
                const fecha = new Date(p.fixture.date).toLocaleDateString('es-AR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  timeZone: 'America/Argentina/Buenos_Aires'
                })

                return (
                  <button
                    key={p.fixture.id}
                    onClick={() => onSelectPartido(p.fixture.id)}
                    className="w-full px-6 py-5 hover:bg-zinc-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:bg-zinc-100 group flex flex-col items-center"
                  >
                    <div className="flex items-center justify-between gap-4 w-full">
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

                    <p className="text-center text-zinc-400 text-[11px] font-bold mt-4 uppercase tracking-widest">{fecha}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="stitch-card animate-pulse flex flex-col p-6">
          <div className="flex flex-col flex-grow">
            <div className="pb-4 border-b border-black/5 flex items-center">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
            </div>
            <div className="mt-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex flex-col py-6 border-b border-black/5">
                  <div className="flex justify-between items-center w-full mb-4">
                    <div className="h-4 bg-zinc-100 rounded w-1/4" />
                    <div className="h-10 bg-zinc-200 rounded w-16" />
                    <div className="h-4 bg-zinc-100 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-zinc-100 rounded w-24 self-center mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
