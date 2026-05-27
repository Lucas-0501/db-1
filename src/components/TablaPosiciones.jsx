import { useEffect, useState } from 'react'
import { getStandings } from '../lib/apifootball'

export default function TablaPosiciones({ competition, nombre }) {
  const [posiciones, setPosiciones] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPosiciones([])
    getStandings(competition)
      .then(setPosiciones)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [competition])

  if (loading) return <Skeleton />
  if (error)   return <p className="text-red-600 text-center py-8 text-sm">{error}</p>
  if (!posiciones.length || posiciones.every(g => g.table.length === 0)) return <p className="text-[#024a4a] text-center py-10 font-medium">Sin datos disponibles para esta liga.</p>

  return (
    <div className="space-y-6 animate-fade-in">
      {posiciones.map((grupo, idx) => (
        <div key={idx} className="glass-light rounded-3xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 glass-dark flex items-center justify-between">
            <h2 className="text-white font-bold text-lg tracking-wide">
              {grupo.groupName ? `Tabla de Posiciones - ${grupo.groupName}` : 'Tabla de Posiciones'}
            </h2>
            <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-semibold">{nombre}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#024a4a] text-xs uppercase border-b border-gray-300 bg-white/30">
                  <th className="px-4 py-3 text-left w-8 font-bold">#</th>
                  <th className="px-4 py-3 text-left font-bold">Equipo</th>
                  <th className="px-2 py-3 text-center font-semibold">PJ</th>
                  <th className="px-2 py-3 text-center font-semibold">PG</th>
                  <th className="px-2 py-3 text-center font-semibold">PE</th>
                  <th className="px-2 py-3 text-center font-semibold">PP</th>
                  <th className="px-2 py-3 text-center font-semibold">GF</th>
                  <th className="px-2 py-3 text-center font-semibold">GC</th>
                  <th className="px-2 py-3 text-center font-semibold">DIF</th>
                  <th className="px-4 py-3 text-center font-black text-[#013535]">PTS</th>
                </tr>
              </thead>
              <tbody>
                {grupo.table.map((pos) => {
                  const dif = pos.goalsDiff
                  // Resaltar puestos de copas / descenso (opcional, por ahora solo primeros)
                  const isTop = pos.rank <= 4;
                  return (
                    <tr key={pos.team.id} className="border-b border-gray-200/50 hover:bg-white/50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isTop ? 'bg-[#013535] text-white' : 'text-gray-500'
                        }`}>
                          {pos.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={pos.team.logo} alt={pos.team.name} className="w-7 h-7 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                          <span className="text-gray-900 font-semibold text-sm group-hover:text-[#013535]">{pos.team.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.played}</td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.win}</td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.draw}</td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.lose}</td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.goals.for}</td>
                      <td className="px-2 py-3 text-center text-gray-700 text-xs font-medium">{pos.all.goals.against}</td>
                      <td className="px-2 py-3 text-center text-xs font-bold">
                        <span className={dif > 0 ? 'text-green-600' : dif < 0 ? 'text-red-500' : 'text-gray-500'}>
                          {dif > 0 ? `+${dif}` : dif}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[#013535] font-black text-base">{pos.points}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="glass-light rounded-3xl overflow-hidden shadow-lg animate-pulse">
      <div className="px-6 py-5 glass-dark h-14" />
      <div className="p-4 space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center border-b border-gray-200/50 pb-4">
            <div className="h-6 w-6 bg-gray-300 rounded-full shrink-0" />
            <div className="h-4 bg-gray-300 rounded w-1/3" />
            <div className="h-4 bg-gray-300 rounded w-8 ml-auto" />
            <div className="h-4 bg-gray-300 rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}
