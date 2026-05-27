import { useState, useEffect } from 'react'
import { getRankingMundial } from '../../lib/supabase'

export default function MundialRanking() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarRanking()
  }, [])

  async function cargarRanking() {
    try {
      const data = await getRankingMundial()
      setRanking(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-10 h-10 border-4 border-[#FF004D]/30 border-t-[#FF004D] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in relative z-20 pr-4 md:pr-32">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">Ranking del Mundial</h3>
          <p className="text-[#FF004D] text-sm">Puntuaciones exclusivas de los partidos de la Copa</p>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-zinc-900 text-white uppercase text-xs font-black tracking-widest border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Jugador</th>
                <th className="px-6 py-4 text-center">Partidos</th>
                <th className="px-6 py-4 text-center">Plenos (3pts)</th>
                <th className="px-6 py-4 text-center text-[#00F0FF]">Pts</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">
                    Aún no hay puntuaciones en el Mundial.
                  </td>
                </tr>
              ) : (
                ranking.map((user, index) => (
                  <tr 
                    key={user.username} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4 font-black">
                      {index === 0 && <span className="text-2xl" title="Campeón">🏆</span>}
                      {index === 1 && <span className="text-2xl" title="Subcampeón">🥈</span>}
                      {index === 2 && <span className="text-2xl" title="Tercer Puesto">🥉</span>}
                      {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF004D] flex items-center justify-center text-black font-black text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {user.cantidad_predicciones}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-[#FF004D]">
                      {user.aciertos_exactos}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-xl text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                      {user.puntaje_total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
