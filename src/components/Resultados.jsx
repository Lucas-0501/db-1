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
  if (!partidos.length) return <p className="text-[#024a4a] text-center py-8 font-medium">Sin partidos disponibles.</p>

  const porFecha = partidos.reduce((acc, p) => {
    const round = p.league.round ?? 'Sin fecha'
    if (!acc[round]) acc[round] = []
    acc[round].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-[#013535] font-bold text-lg px-1">{titulo}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(porFecha).map(([round, lista]) => (
          <div key={round} className="glass-light rounded-3xl overflow-hidden shadow-lg flex flex-col">
            <div className="px-5 py-3 glass-dark">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">{round}</h3>
            </div>
            <div className="divide-y divide-gray-200/50 flex-grow">
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
                    className="w-full px-5 py-4 hover:bg-white/40 transition-colors group flex flex-col items-center"
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
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
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1 shadow-sm ${
                          vivo
                            ? 'bg-red-500 text-white animate-pulse'
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

                    <p className="text-center text-gray-500 text-[11px] font-medium mt-3 bg-white/50 px-3 py-1 rounded-full">{fecha}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="glass-light rounded-3xl overflow-hidden shadow-lg animate-pulse flex flex-col">
          <div className="px-5 py-4 glass-dark h-12" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex flex-col px-5 py-5 border-b border-gray-200/50">
              <div className="flex justify-between items-center w-full mb-3">
                <div className="h-4 bg-gray-300 rounded w-1/4" />
                <div className="h-8 bg-gray-300 rounded w-16" />
                <div className="h-4 bg-gray-300 rounded w-1/4" />
              </div>
              <div className="h-3 bg-gray-300 rounded w-20 self-center" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
