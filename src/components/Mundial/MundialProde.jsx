import { useState, useEffect, useMemo } from 'react'
import { getPartidosMundial, guardarPrediccion, sincronizarPartidos } from '../../lib/supabase'
import { getStandings, getAllMatches } from '../../lib/apifootball'
import TournamentBracket from './TournamentBracket'
import PredictionModal from './PredictionModal'

export default function MundialProde({ user }) {
  const [partidos, setPartidos] = useState([])
  const [gruposOriginales, setGruposOriginales] = useState([])
  const [partidosApiData, setPartidosApiData] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [inputs, setInputs] = useState({})
  const [syncing, setSyncing] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [user])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [dataPartidos, dataStandings, dataApi] = await Promise.all([
        getPartidosMundial(user.id),
        getStandings('WC'),
        getAllMatches('WC')
      ])
      
      setPartidos(dataPartidos)
      setGruposOriginales(dataStandings)
      setPartidosApiData(dataApi)
      
      const initialInputs = {}
      dataPartidos.forEach(p => {
        if (p.prediccion_usuario) {
          initialInputs[p.id] = {
            local: p.prediccion_usuario.goles_local_predichos,
            visitante: p.prediccion_usuario.goles_visitante_predichos
          }
        } else {
          initialInputs[p.id] = { local: '', visitante: '' }
        }
      })
      setInputs(initialInputs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleInput(partidoId, team, value) {
    if (value < 0) return
    setInputs(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [team]: value
      }
    }))
  }

  async function handleSave(partidoId) {
    const { local, visitante } = inputs[partidoId]
    if (local === '' || visitante === '') return

    setSavingId(partidoId)
    try {
      await guardarPrediccion(user.id, partidoId, parseInt(local), parseInt(visitante))
      
      // Refrescar solo partidos de BD (la API tiene caché o no es necesario llamarla si no hay partidos nuevos)
      const dataPartidos = await getPartidosMundial(user.id)
      setPartidos(dataPartidos)
    } catch (e) {
      alert("Error al guardar predicción")
    } finally {
      setSavingId(null)
    }
  }

  async function handleModalSave(partidoId, local, visitante) {
    setSavingId(partidoId)
    try {
      await guardarPrediccion(user.id, partidoId, parseInt(local), parseInt(visitante))
      const dataPartidos = await getPartidosMundial(user.id)
      setPartidos(dataPartidos)
    } catch (e) {
      alert("Error al guardar predicción")
      throw e
    } finally {
      setSavingId(null)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const partidosApi = await getAllMatches('WC')
      await sincronizarPartidos(partidosApi)
      await cargarDatos()
    } catch (e) {
      alert("Error al sincronizar: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  // Motor de simulación de tabla "What-If"
  const gruposSimulados = useMemo(() => {
    if (!gruposOriginales || gruposOriginales.length === 0) return []
    
    return gruposOriginales.map(grupoOriginal => {
      // Clonar tabla
      const table = grupoOriginal.table.map(t => ({
        ...t,
        all: { ...t.all, goals: { ...t.all.goals } }
      }))
      
      partidos.forEach(p => {
        const teamLocal = table.find(t => t.team.name === p.equipo_local)
        const teamVis = table.find(t => t.team.name === p.equipo_visitante)
        
        if (teamLocal && teamVis) {
          if (p.estado === 'programado' && inputs[p.id] && inputs[p.id].local !== '' && inputs[p.id].visitante !== '') {
            const gl = parseInt(inputs[p.id].local)
            const gv = parseInt(inputs[p.id].visitante)
            
            teamLocal.all.played += 1
            teamVis.all.played += 1
            teamLocal.all.goals.for += gl
            teamLocal.all.goals.against += gv
            teamVis.all.goals.for += gv
            teamVis.all.goals.against += gl
            teamLocal.goalsDiff += (gl - gv)
            teamVis.goalsDiff += (gv - gl)
            
            if (gl > gv) {
              teamLocal.points += 3
              teamLocal.all.win += 1
              teamVis.all.lose += 1
            } else if (gl < gv) {
              teamVis.points += 3
              teamVis.all.win += 1
              teamLocal.all.lose += 1
            } else {
              teamLocal.points += 1
              teamVis.points += 1
              teamLocal.all.draw += 1
              teamVis.all.draw += 1
            }
          }
        }
      })
      
      table.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff
        return b.all.goals.for - a.all.goals.for
      })
      
      table.forEach((t, i) => t.rank = i + 1)
      
      return {
        groupName: grupoOriginal.groupName,
        table
      }
    })
  }, [gruposOriginales, partidos, inputs])

  if (loading && partidos.length === 0) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-10 h-10 border-4 border-[#A2FF00]/30 border-t-[#A2FF00] rounded-full animate-spin" />
    </div>
  )

  const partidosAsignados = new Set()

  return (
    <div className="animate-fade-in relative z-20 w-full">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-0">
        <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Predicciones y Grupos</h3>
            <p className="text-zinc-400 font-medium mt-1">Cargá tus resultados y mirá cómo quedaría la tabla de cada grupo en vivo.</p>
          </div>
          
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 md:mt-0 bg-[#A2FF00]/10 text-[#A2FF00] font-black uppercase text-xs tracking-widest py-2.5 px-5 rounded-xl border border-[#A2FF00]/30 hover:bg-[#A2FF00] hover:text-black hover:shadow-[0_0_20px_rgba(162,255,0,0.5)] transition-[transform,color,background-color,box-shadow] duration-200 ease-[var(--ease-out-emil)] active:scale-[0.97] flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : '🔄 Sincronizar API'}
          </button>
        </div>
        
        <div className="w-full flex justify-center">
          <img 
            src="/grupos_mundial.png" 
            alt="Grupos del Mundial" 
            className="w-full max-w-5xl h-auto rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-zinc-800"
          />
        </div>
      </div>

      {gruposSimulados.length === 0 ? (
        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-8 text-center backdrop-blur-sm mx-4 md:mx-0">
          <p className="text-gray-300 font-medium">Aún no hay datos de grupos del Mundial disponibles.</p>
        </div>
      ) : (
        gruposSimulados.map((grupo, grupoIndex) => {
          // Filtrar los partidos que pertenecen a este grupo
          const partidosDelGrupo = partidos.filter(p => {
            const isLocal = grupo.table.some(t => t.team.name === p.equipo_local)
            const isVis = grupo.table.some(t => t.team.name === p.equipo_visitante)
            if (isLocal && isVis) {
              partidosAsignados.add(p.id)
              return true
            }
            return false
          })

          return (
            <div key={grupo.groupName} className="bg-black/40 backdrop-blur-xl rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl mb-8 mx-4 md:mx-0 opacity-0 animate-stagger-fade" style={{ animationDelay: `${grupoIndex * 100}ms` }}>
              <div className="bg-zinc-950 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
                <h3 className="text-xl font-black text-white tracking-widest uppercase">{grupo.groupName?.replace('GROUP ', 'GRUPO ')}</h3>
                <span className="bg-[#00F0FF] text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Fase de Grupos
                </span>
              </div>
              
              <div className="flex flex-col xl:flex-row">
                
                {/* Lado Izquierdo: Partidos */}
                <div className="flex-1 p-6 space-y-4 border-b xl:border-b-0 xl:border-r border-zinc-800">
                  {partidosDelGrupo.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic py-4">No hay partidos cargados en tu base de datos para los equipos de este grupo.</p>
                  ) : (
                    partidosDelGrupo.map((p, index) => {
                      const isLocked = p.estado !== 'programado'
                      const hasVoted = p.prediccion_usuario != null
                      const isSaving = savingId === p.id

                      return (
                        <div key={p.id} className="bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl p-4 border border-zinc-800 flex flex-col md:flex-row items-center gap-4 justify-between transition-colors duration-200 ease-[var(--ease-out-emil)] opacity-0 animate-stagger-fade" style={{ animationDelay: `${grupoIndex * 100 + 150 + Math.min(index * 40, 600)}ms` }}>
                          {/* Info Partido */}
                          <div className="flex-1 text-center md:text-left w-full">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF] mb-2">
                              {new Date(p.fecha).toLocaleDateString()}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                              <div className="flex items-center gap-3 w-[120px] justify-end">
                                <span className="font-bold text-white text-base uppercase truncate">{p.equipo_local}</span>
                                {p.escudo_local && <img src={p.escudo_local} alt={p.equipo_local} className="w-8 h-8 object-contain drop-shadow-md" />}
                              </div>
                              <span className="text-[#FF004D] text-sm font-black">VS</span>
                              <div className="flex items-center gap-3 w-[120px] justify-start">
                                {p.escudo_visitante && <img src={p.escudo_visitante} alt={p.equipo_visitante} className="w-8 h-8 object-contain drop-shadow-md" />}
                                <span className="font-bold text-white text-base uppercase truncate">{p.equipo_visitante}</span>
                              </div>
                            </div>
                          </div>

                          {/* Inputs */}
                          <div className="flex items-center gap-3">
                            {isLocked ? (
                              <div className="flex flex-col items-center w-[100px]">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${p.estado === 'en_curso' ? 'text-[#00F0FF] animate-pulse' : 'text-[#FF004D]'}`}>
                                  {p.estado === 'en_curso' ? 'En Vivo' : 'Finalizado'}
                                </span>
                                <span className="font-black text-2xl text-white">
                                  {p.goles_local_reales ?? '-'} - {p.goles_visitante_reales ?? '-'}
                                </span>
                              </div>
                            ) : (
                              <>
                                <input 
                                  type="number" min="0"
                                  value={inputs[p.id]?.local ?? ''}
                                  onChange={(e) => handleInput(p.id, 'local', e.target.value)}
                                  className="w-12 h-12 text-center text-xl font-black text-white bg-zinc-800 rounded-lg border border-transparent focus:border-[#00F0FF] outline-none transition-colors duration-150 ease-[var(--ease-out-emil)] placeholder:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-zinc-600 font-black">-</span>
                                <input 
                                  type="number" min="0"
                                  value={inputs[p.id]?.visitante ?? ''}
                                  onChange={(e) => handleInput(p.id, 'visitante', e.target.value)}
                                  className="w-12 h-12 text-center text-xl font-black text-white bg-zinc-800 rounded-lg border border-transparent focus:border-[#00F0FF] outline-none transition-colors duration-150 ease-[var(--ease-out-emil)] placeholder:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </>
                            )}
                          </div>

                          {/* Guardar */}
                          <div className="w-full md:w-auto flex justify-center shrink-0">
                            {isLocked ? (
                              <div className="text-center w-[100px]">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Tu Voto</p>
                                <p className="font-black text-[#00F0FF] text-lg">
                                  {hasVoted ? `${p.prediccion_usuario.goles_local_predichos}-${p.prediccion_usuario.goles_visitante_predichos}` : '-'}
                                </p>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleSave(p.id)}
                                disabled={isSaving || inputs[p.id]?.local === '' || inputs[p.id]?.visitante === ''}
                                className="w-full md:w-auto md:min-w-[110px] bg-[#00F0FF] text-black font-black py-2 px-4 rounded-lg disabled:opacity-50 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] text-xs uppercase transition-[transform,background-color,box-shadow,color] duration-200 ease-[var(--ease-out-emil)] active:scale-[0.97]"
                              >
                                {isSaving ? '...' : (hasVoted ? 'Actualizar' : 'Guardar')}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Lado Derecho: Tabla del Grupo */}
                <div className="xl:w-[480px] p-6 bg-zinc-950">
                  <h4 className="text-[#00F0FF] font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></span>
                    Tabla en Vivo (Simulación)
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-white">
                      <thead className="text-[#FF004D] uppercase border-b border-zinc-800">
                        <tr>
                          <th className="py-2 pr-2 w-6">#</th>
                          <th className="py-2">Equipo</th>
                          <th className="py-2 text-center" title="Partidos Jugados">PJ</th>
                          <th className="py-2 text-center text-gray-400 hidden sm:table-cell" title="Goles a Favor">GF</th>
                          <th className="py-2 text-center text-gray-400 hidden sm:table-cell" title="Goles en Contra">GC</th>
                          <th className="py-2 text-center" title="Diferencia de Gol">DIF</th>
                          <th className="py-2 text-center text-lg font-black text-[#A2FF00]">PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.table.map(pos => {
                          const isTop = pos.rank <= 2
                          return (
                            <tr key={pos.team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-2 pr-2">
                                <span className={`flex items-center justify-center w-5 h-5 rounded-sm text-[10px] font-black ${
                                  isTop ? 'bg-[#00F0FF] text-black' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {pos.rank}
                                </span>
                              </td>
                              <td className="py-2 font-bold flex items-center gap-2">
                                <img src={pos.team.logo} alt={pos.team.name} className="w-5 h-5 object-contain" />
                                <span className="truncate max-w-[90px] sm:max-w-[120px]">{pos.team.name}</span>
                              </td>
                              <td className="py-2 text-center text-gray-300 font-medium">{pos.all.played}</td>
                              <td className="py-2 text-center text-gray-500 font-medium hidden sm:table-cell">{pos.all.goals.for}</td>
                              <td className="py-2 text-center text-gray-500 font-medium hidden sm:table-cell">{pos.all.goals.against}</td>
                              <td className="py-2 text-center font-bold">
                                <span className={pos.goalsDiff > 0 ? 'text-[#00F0FF]' : pos.goalsDiff < 0 ? 'text-[#FF004D]' : 'text-gray-500'}>
                                  {pos.goalsDiff > 0 ? `+${pos.goalsDiff}` : pos.goalsDiff}
                                </span>
                              </td>
                              <td className="py-2 text-center text-lg font-black text-white">
                                {pos.points}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-4 text-center">
                    Los primeros 2 clasifican a la siguiente ronda.
                  </p>
                </div>
                
              </div>
            </div>
          )
        })
      )}
      </div> {/* Fin del wrapper max-w-5xl */}
      
      {/* Fases Eliminatorias (Bracket) */}
      {(() => {
        const partidosPlayoffs = partidos.filter(p => !partidosAsignados.has(p.id));
        if (partidosPlayoffs.length === 0) return null;

        // Agrupar por ronda
        const partidosPorRonda = {};
        partidosPlayoffs.forEach(p => {
          const apiMatch = partidosApiData.find(a => a.fixture.id === p.api_fixture_id);
          const stage = apiMatch?.league?.round ?? 'FINAL';
          
          if (!partidosPorRonda[stage]) partidosPorRonda[stage] = [];
          partidosPorRonda[stage].push(p);
        });

        // Crear mapa de predicciones para el bracket { matchId: { local, visitante } }
        const userPredictions = {}
        partidosPlayoffs.forEach(p => {
           if (p.prediccion_usuario) {
              userPredictions[p.id] = {
                 local: p.prediccion_usuario.goles_local_predichos,
                 visitante: p.prediccion_usuario.goles_visitante_predichos
              }
           }
        })

        return (
          <div className="mt-16 w-full max-w-[1920px] mx-auto px-4">
            <h3 className="text-3xl font-black text-white tracking-tight uppercase mb-8 border-t border-zinc-800 pt-8 max-w-5xl mx-auto">
              Fases Eliminatorias
            </h3>
            <TournamentBracket 
              partidosPorRonda={partidosPorRonda} 
              onMatchClick={(match) => setSelectedMatch(match)}
              userPredictions={userPredictions}
            />
          </div>
        )
      })()}

      {/* Modal de Predicción */}
      {selectedMatch && (
        <PredictionModal 
          match={selectedMatch}
          initialLocal={selectedMatch.prediccion_usuario?.goles_local_predichos}
          initialVisitante={selectedMatch.prediccion_usuario?.goles_visitante_predichos}
          onClose={() => setSelectedMatch(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
