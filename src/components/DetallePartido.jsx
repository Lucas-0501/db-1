import { useEffect, useState } from 'react'
import { getPartidoDetalle, mapEstado } from '../lib/apifootball'

export default function DetallePartido({ partidoId, onClose }) {
  const [fixture, setFixture] = useState(null)
  const [goles, setGoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getPartidoDetalle(partidoId)
      .then(({ fixture, goles }) => {
        setFixture(fixture)
        setGoles(goles)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [partidoId])

  const estado = fixture ? mapEstado(fixture.fixture.status.short, fixture.fixture.status.elapsed) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#013535]/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-light bg-white/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="px-6 py-4 glass-dark flex items-center justify-between border-b border-white/10">
          <span className="text-white/80 text-sm font-semibold tracking-wide uppercase">
            {fixture ? fixture.league.round : 'Cargando...'}
          </span>
          <button onClick={onClose} className="text-white/60 hover:text-white text-3xl leading-none transition-colors drop-shadow-md">&times;</button>
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#024a4a]/30 border-t-[#013535] rounded-full animate-spin shadow-sm" />
          </div>
        )}

        {error && <p className="text-red-600 text-center py-10 font-medium">{error}</p>}

        {fixture && (
          <>
            {/* Marcador */}
            <div className="px-8 py-8 flex items-center justify-between gap-4">
              <TeamBlock equipo={fixture.teams.home} />

              <div className="text-center shrink-0">
                <p className="text-[#013535] text-5xl font-black tabular-nums tracking-tighter drop-shadow-sm">
                  {fixture.goals.home ?? '-'} <span className="text-[#024a4a] text-4xl mx-1">–</span> {fixture.goals.away ?? '-'}
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mt-2 inline-block shadow-sm ${
                  estado.vivo ? 'bg-red-500 text-white animate-pulse' : 'bg-[#013535] text-white'
                }`}>
                  {estado.texto}
                </span>
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mt-3">
                  {new Date(fixture.fixture.date).toLocaleDateString('es-AR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    timeZone: 'America/Argentina/Buenos_Aires',
                  })}
                </p>
              </div>

              <TeamBlock equipo={fixture.teams.away} />
            </div>

            {/* Goles */}
            <div className="px-6 pb-8">
              {goles.length > 0 ? (
                <div className="bg-white/50 rounded-2xl p-5 shadow-inner">
                  <h4 className="text-[#013535] text-xs font-bold uppercase tracking-widest mb-3 text-center">Goles</h4>
                  <ul className="space-y-3">
                    {goles.map((g, i) => {
                      const esLocal = g.team.id === fixture.teams.home.id
                      return (
                        <li key={i} className={`flex items-center gap-3 text-sm ${esLocal ? '' : 'flex-row-reverse'}`}>
                          <span className="text-gray-500 font-bold w-8 text-center shrink-0">{g.time.elapsed}'</span>
                          <span className="text-lg drop-shadow-sm">⚽</span>
                          <span className="text-gray-900 font-semibold">
                            {g.player.name}
                            {g.detail === 'Penalty' && <span className="text-yellow-600 text-xs font-bold ml-1.5">(P)</span>}
                            {g.detail === 'Own Goal' && <span className="text-red-500 text-xs font-bold ml-1.5">(EC)</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="bg-white/40 rounded-2xl py-6 border border-white/50">
                  <p className="text-gray-500 text-sm font-medium text-center">Sin goles registrados</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TeamBlock({ equipo }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md p-2">
        <img src={equipo.logo} className="w-full h-full object-contain drop-shadow-sm" alt={equipo.name} />
      </div>
      <p className="text-gray-900 font-bold text-sm text-center leading-tight">{equipo.name}</p>
    </div>
  )
}
