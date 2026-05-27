import { useState, useEffect } from 'react'
import { getRankingProde } from '../lib/supabase'

export default function RankingProde() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarRanking()
  }, [])

  async function cargarRanking() {
    try {
      const data = await getRankingProde()
      setRanking(data)
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
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="glass-dark p-6 rounded-t-3xl border-b border-white/10 text-center">
        <h2 className="text-3xl font-black text-white tracking-tight">🏆 Ranking Global</h2>
        <p className="text-teal-100/70 text-sm mt-1">Tabla de posiciones del Prode leída desde Supabase (Vista)</p>
      </div>

      <div className="glass-light rounded-b-3xl shadow-lg border border-t-0 border-white/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/40 text-[#013535] text-xs uppercase tracking-wider">
              <th className="py-4 px-6 text-center w-16">Pos</th>
              <th className="py-4 px-6">Usuario</th>
              <th className="py-4 px-6 text-center">Aciertos Exactos</th>
              <th className="py-4 px-6 text-center">Jugados</th>
              <th className="py-4 px-6 text-right font-black">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30 text-sm">
            {ranking.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-[#024a4a] py-10 font-medium">No hay jugadores registrados aún.</td>
              </tr>
            ) : (
              ranking.map((user, i) => (
                <tr key={i} className={`hover:bg-white/50 transition-colors ${i < 3 ? 'font-bold' : 'font-medium text-gray-700'}`}>
                  <td className="py-4 px-6 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className={i < 3 ? 'text-[#013535]' : ''}>{user.username}</span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-500">
                    {user.aciertos_exactos}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-500">
                    {user.cantidad_predicciones}
                  </td>
                  <td className="py-4 px-6 text-right font-black text-lg text-[#013535]">
                    {user.puntaje_total}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
