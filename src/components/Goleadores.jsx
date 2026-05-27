import { useEffect, useState } from 'react'
import { getTopScorers } from '../lib/apifootball'

export default function Goleadores({ competition }) {
  const [goleadores, setGoleadores] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setGoleadores([])
    getTopScorers(competition)
      .then(setGoleadores)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [competition])

  if (loading) return <Skeleton />
  if (error)   return <p className="text-red-600 text-center py-8 text-sm">{error}</p>
  if (!goleadores.length) return <p className="text-[#024a4a] text-center py-10 font-medium">Sin datos disponibles para esta liga.</p>

  return (
    <div className="glass-light rounded-3xl overflow-hidden shadow-lg animate-fade-in max-w-3xl mx-auto">
      <div className="px-6 py-4 glass-dark">
        <h2 className="text-white font-bold text-lg tracking-wide">Máximos Goleadores</h2>
      </div>

      <ul className="divide-y divide-gray-200/50">
        {goleadores.map((g, i) => (
          <li key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/50 transition-colors group">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm
              ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900'
              : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
              : i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
              : 'bg-white/60 text-[#013535] border border-gray-300'}`}>
              {i + 1}
            </span>

            {g.foto ? (
              <img src={g.foto} alt={g.nombre} className="w-10 h-10 rounded-full object-cover shrink-0 drop-shadow-sm border-2 border-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 border-2 border-white flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">{g.nombre.substring(0, 1)}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-bold text-sm truncate group-hover:text-[#013535]">{g.nombre}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {g.escudo && <img src={g.escudo} className="w-3.5 h-3.5 object-contain drop-shadow-sm" alt="" />}
                <p className="text-[#024a4a] text-xs font-medium truncate">{g.equipo}</p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[#013535] font-black text-2xl leading-none tracking-tighter">{g.goles}</span>
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">goles</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="glass-light rounded-3xl overflow-hidden shadow-lg animate-pulse max-w-3xl mx-auto">
      <div className="px-6 py-5 glass-dark h-14" />
      <div className="p-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-200/50">
            <div className="w-8 h-8 bg-gray-300 rounded-full shrink-0" />
            <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/3" />
            </div>
            <div className="h-6 bg-gray-300 rounded w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
