import { useState, useEffect } from 'react'
import { getPartidosProde, guardarPrediccion, sincronizarPartidos } from '../lib/supabase'
import { getMatchesHoy } from '../lib/apifootball'

export default function JugarProde({ user }) {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  
  // Sincronización
  const [syncing, setSyncing] = useState(false)
  
  // Estado local para los inputs { partido_id: { local, visitante } }
  const [inputs, setInputs] = useState({})

  useEffect(() => {
    cargarPartidos()
  }, [user])

  async function cargarPartidos() {
    setLoading(true)
    try {
      const data = await getPartidosProde(user.id)
      setPartidos(data)
      
      // Inicializar inputs con predicciones previas si existen
      const initialInputs = {}
      data.forEach(p => {
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
      // Refrescar para confirmar que se guardó
      await cargarPartidos()
    } catch (e) {
      alert("Error al guardar predicción")
    } finally {
      setSavingId(null)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      // 1. Traer próximos partidos de la API Real (Partidos Destacados de hoy)
      const partidosApi = await getMatchesHoy()
      
      // 2. Inyectarlos en nuestra Base de Datos Supabase (Upsert)
      await sincronizarPartidos(partidosApi)
      
      // 3. Volver a cargar la lista de Supabase con nuestras predicciones cruzadas
      await cargarPartidos()
      alert("¡Partidos sincronizados con éxito desde la API!")
    } catch (e) {
      alert("Error al sincronizar: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  if (loading && partidos.length === 0) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="relative w-full">
      
      {/* Contenedor Izquierdo (Fondo Pixeles + Mourinho) */}
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
        {/* <img 
          src="/mourinho.png" 
          alt="Mourinho" 
          className="absolute bottom-0 right-0 w-[400px] h-auto object-contain drop-shadow-2xl opacity-90 transition-transform hover:scale-105"
          style={{ 
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', 
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' 
          }}
        /> */}
      </div>

      {/* Contenedor Central del Prode */}
      <div className="animate-fade-in space-y-4 relative z-10">
      <div className="glass-light p-6 rounded-3xl mb-6 shadow-md border border-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#013535] tracking-tight">Jugar al Prode</h2>
          <p className="text-[#024a4a] text-sm mt-1">Ingresa tus predicciones para los próximos partidos.</p>
        </div>
        
        {/* Controles de Sincronización API -> Supabase */}
        <div className="flex items-center gap-3 bg-white/40 p-2 rounded-2xl shadow-inner border border-white/60 w-full md:w-auto">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-2 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : '🔄 Sincronizar API'}
          </button>
        </div>
      </div>

      {partidos.length === 0 ? (
        <p className="text-center text-[#024a4a] font-medium py-10">No hay partidos disponibles.</p>
      ) : (
        partidos.map(p => {
          const isLocked = p.estado !== 'programado'
          const hasVoted = p.prediccion_usuario != null
          const isSaving = savingId === p.id

          return (
            <div key={p.id} className="glass-light rounded-2xl p-5 shadow-sm border border-white/40 flex flex-col md:flex-row items-center gap-4 justify-between transition-transform hover:scale-[1.01]">
              
              {/* Info Partido */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#024a4a] bg-white/50 px-2 py-0.5 rounded-md">
                    {new Date(p.fecha).toLocaleDateString()}
                  </span>
                  {p.liga && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/50 px-2 py-0.5 rounded-md">
                      {p.liga}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                  <div className="flex items-center gap-2 w-[120px] justify-end">
                    <span className="font-bold text-gray-800 text-lg truncate">{p.equipo_local}</span>
                    {p.escudo_local && <img src={p.escudo_local} alt={p.equipo_local} className="w-8 h-8 object-contain" />}
                  </div>
                  <span className="text-gray-400 text-sm font-bold">VS</span>
                  <div className="flex items-center gap-2 w-[120px] justify-start">
                    {p.escudo_visitante && <img src={p.escudo_visitante} alt={p.equipo_visitante} className="w-8 h-8 object-contain" />}
                    <span className="font-bold text-gray-800 text-lg truncate">{p.equipo_visitante}</span>
                  </div>
                </div>
              </div>

              {/* Controles de Predicción */}
              <div className="flex items-center gap-3 bg-white/40 p-2 rounded-2xl shadow-inner border border-white/50">
                {isLocked ? (
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.estado === 'en_curso' ? 'text-green-600 animate-pulse' : 'text-red-500'}`}>
                      {p.estado === 'en_curso' ? 'En Vivo' : 'Finalizado'}
                    </span>
                    <span className="font-black text-2xl text-[#013535]">
                      {p.goles_local_reales ?? '-'} - {p.goles_visitante_reales ?? '-'}
                    </span>
                  </div>
                ) : (
                  <>
                    <input 
                      type="number" 
                      min="0"
                      value={inputs[p.id]?.local ?? ''}
                      onChange={(e) => handleInput(p.id, 'local', e.target.value)}
                      placeholder="0"
                      className="w-14 h-14 text-center text-2xl font-black text-[#013535] bg-white rounded-xl shadow-sm border-0 focus:ring-4 focus:ring-teal-500/30 outline-none transition-all placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-teal-900/40 font-black text-xl">-</span>
                    <input 
                      type="number" 
                      min="0"
                      value={inputs[p.id]?.visitante ?? ''}
                      onChange={(e) => handleInput(p.id, 'visitante', e.target.value)}
                      placeholder="0"
                      className="w-14 h-14 text-center text-2xl font-black text-[#013535] bg-white rounded-xl shadow-sm border-0 focus:ring-4 focus:ring-teal-500/30 outline-none transition-all placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </>
                )}
              </div>

              {/* Botón Guardar / Estado */}
              <div className="w-full md:w-auto shrink-0 flex justify-center">
                {isLocked ? (
                  <div className="text-center px-4 bg-white/30 rounded-xl py-2">
                    {p.estado === 'en_curso' && <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Predicciones Cerradas</p>}
                    <p className="text-xs font-bold text-gray-500 uppercase">Tu Predicción</p>
                    <p className="font-bold text-[#013535] text-lg">
                      {hasVoted ? `${p.prediccion_usuario.goles_local_predichos} - ${p.prediccion_usuario.goles_visitante_predichos}` : 'No votaste'}
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleSave(p.id)}
                    disabled={isSaving || inputs[p.id]?.local === '' || inputs[p.id]?.visitante === ''}
                    className="relative group overflow-hidden w-full md:w-[140px] bg-gradient-to-br from-[#013535] to-[#024a4a] text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_8px_20px_-6px_rgba(1,53,53,0.5)] hover:-translate-y-0.5 flex items-center justify-center border border-white/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-teal-400/20 to-teal-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10 tracking-wide text-sm">{isSaving ? 'Guardando...' : (hasVoted ? 'Actualizar' : 'Guardar')}</span>
                  </button>
                )}
              </div>

            </div>
          )
        })
      )}
      </div>

      {/* Contenedor Derecho (Fondo Pixeles + Neymar) */}
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
          src="/neymar.png" 
          alt="Neymar" 
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
