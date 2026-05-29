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
  if (!posiciones.length || posiciones.every(g => g.table.length === 0)) return <p className="text-zinc-500 text-center py-10 font-bold">Sin datos disponibles para esta liga.</p>

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-7xl mx-auto">
      {posiciones.map((grupo, idx) => (
        <div key={idx} className="stitch-card flex flex-col p-8 animate-stagger-fade" style={{ animationDelay: `${idx * 150}ms` }}>
          <div className="flex flex-col flex-grow">
            <div className="pb-6 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-zinc-900 font-bold text-lg tracking-wide">
                {grupo.groupName ? `Tabla de Posiciones - ${grupo.groupName}` : 'Tabla de Posiciones'}
              </h2>
              <span className="bg-zinc-100 px-3 py-1 rounded-full text-zinc-500 text-xs font-bold tracking-wider uppercase">{nombre}</span>
            </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 text-[10px] tracking-widest uppercase border-b border-black/5 bg-zinc-50/50">
                  <th className="px-4 py-4 text-left w-8 font-bold">#</th>
                  <th className="px-4 py-4 text-left font-bold">Equipo</th>
                  <th className="px-2 py-4 text-center font-bold">PJ</th>
                  <th className="px-2 py-4 text-center font-bold">PG</th>
                  <th className="px-2 py-4 text-center font-bold">PE</th>
                  <th className="px-2 py-4 text-center font-bold">PP</th>
                  <th className="px-2 py-4 text-center font-bold">GF</th>
                  <th className="px-2 py-4 text-center font-bold">GC</th>
                  <th className="px-2 py-4 text-center font-bold">DIF</th>
                  <th className="px-4 py-4 text-center font-black text-zinc-900">PTS</th>
                </tr>
              </thead>
              <tbody>
                {grupo.table.map((pos) => {
                  const dif = pos.goalsDiff
                  // Resaltar puestos de copas
                  const isTop = pos.rank <= 4;
                  return (
                    <tr key={pos.team.id} className="border-b border-black/5 hover:bg-zinc-50 transition-colors group">
                      <td className="px-4 py-4">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isTop ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-400'
                        }`}>
                          {pos.rank}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={pos.team.logo} alt={pos.team.name} className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
                          <span className="text-zinc-600 font-bold text-sm group-hover:text-zinc-900 transition-colors">{pos.team.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-center text-zinc-500 text-xs font-semibold tabular-nums">{pos.all.played}</td>
                      <td className="px-2 py-4 text-center text-zinc-500 text-xs font-semibold tabular-nums">{pos.all.win}</td>
                      <td className="px-2 py-4 text-center text-zinc-500 text-xs font-semibold tabular-nums">{pos.all.draw}</td>
                      <td className="px-2 py-4 text-center text-zinc-500 text-xs font-semibold tabular-nums">{pos.all.lose}</td>
                      <td className="px-2 py-4 text-center text-zinc-400 text-xs font-medium tabular-nums">{pos.all.goals.for}</td>
                      <td className="px-2 py-4 text-center text-zinc-400 text-xs font-medium tabular-nums">{pos.all.goals.against}</td>
                      <td className="px-2 py-4 text-center text-xs font-bold tabular-nums">
                        <span className={dif > 0 ? 'text-teal-600' : dif < 0 ? 'text-red-500' : 'text-zinc-400'}>
                          {dif > 0 ? `+${dif}` : dif}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-zinc-900 font-black text-lg tabular-nums">{pos.points}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="glass-light flex flex-col animate-pulse">
      <div className="glass-inner bg-white flex flex-col flex-grow">
        <div className="px-6 py-6 border-b border-black/5 flex items-center">
          <div className="h-6 w-48 bg-zinc-200 rounded" />
        </div>
        <div className="p-4 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center border-b border-black/5 pb-4">
              <div className="h-6 w-6 bg-zinc-100 rounded-full shrink-0" />
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-4 bg-zinc-100 rounded w-8 ml-auto" />
              <div className="h-4 bg-zinc-100 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
