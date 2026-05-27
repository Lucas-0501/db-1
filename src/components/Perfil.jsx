import { useState, useEffect } from 'react'
import { getPerfilHistorial } from '../lib/supabase'

export default function Perfil({ user }) {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [user])

  async function cargarHistorial() {
    try {
      const data = await getPerfilHistorial(user.id)
      setHistorial(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      
      {/* Tarjeta de Perfil */}
      <div className="glass-dark p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full shadow-inner flex items-center justify-center text-4xl font-black text-[#013535]">
          {user.username?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-3xl font-black text-white tracking-tight">{user.username}</h2>
          <p className="text-teal-200/70 font-medium">{user.email}</p>
        </div>
        <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20 min-w-[150px]">
          <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Puntos Totales</p>
          <p className="text-5xl font-black text-white">{user.puntos_totales}</p>
        </div>
      </div>

      {/* Historial de Predicciones */}
      <div className="glass-light p-6 rounded-3xl shadow-md border border-white/50">
        <h3 className="text-xl font-black text-[#013535] mb-4">Historial de Predicciones</h3>
        
        {historial.length === 0 ? (
          <p className="text-[#024a4a] py-8 text-center font-medium">Aún no has hecho predicciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/40 text-[#013535] text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4 text-center">Tu Predicción</th>
                  <th className="py-3 px-4 text-center">Resultado Real</th>
                  <th className="py-3 px-4 text-center">Puntos Obtenidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 text-sm">
                {historial.map((item, i) => {
                  const p = item.partido
                  const pts = item.puntos_obtenidos
                  
                  return (
                    <tr key={i} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{p.equipo_local} <span className="text-gray-400 font-normal text-xs mx-1">vs</span> {p.equipo_visitante}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#013535] bg-white/40">
                        {item.goles_local_predichos} - {item.goles_visitante_predichos}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-600">
                        {p.estado === 'finalizado' ? `${p.goles_local_reales} - ${p.goles_visitante_reales}` : 'Pendiente'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.estado === 'finalizado' ? (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            pts === 3 ? 'bg-green-100 text-green-700' :
                            pts === 1 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            +{pts} pts
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
