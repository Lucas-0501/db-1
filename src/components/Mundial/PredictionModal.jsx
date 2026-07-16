import { useState, useEffect } from 'react'

export default function PredictionModal({ match, initialLocal, initialVisitante, onClose, onSave }) {
  const [local, setLocal] = useState(initialLocal ?? '')
  const [visitante, setVisitante] = useState(initialVisitante ?? '')
  const [saving, setSaving] = useState(false)

  const isLocked = match.estado !== 'programado'
  const hasVoted = initialLocal !== '' && initialLocal !== undefined

  // Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  async function handleSave() {
    if (local === '' || visitante === '') return
    setSaving(true)
    try {
      await onSave(match.id, local, visitante)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-zinc-900 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
          <div className="text-[#FF004D] text-xs font-black uppercase tracking-widest">
            {new Date(match.fecha).toLocaleDateString()}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            {/* Local */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              {match.escudo_local ? (
                <img src={match.escudo_local} alt={match.equipo_local} className="w-16 h-16 object-contain drop-shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold">?</div>
              )}
              <span className="font-bold text-white text-center text-sm uppercase leading-tight">{match.equipo_local}</span>
            </div>
            
            {/* VS */}
            <div className="text-[#00F0FF] text-xl font-black">VS</div>
            
            {/* Visitante */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              {match.escudo_visitante ? (
                <img src={match.escudo_visitante} alt={match.equipo_visitante} className="w-16 h-16 object-contain drop-shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold">?</div>
              )}
              <span className="font-bold text-white text-center text-sm uppercase leading-tight">{match.equipo_visitante}</span>
            </div>
          </div>

          {/* Inputs o Resultado */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {isLocked ? (
              <div className="flex flex-col items-center bg-zinc-900 rounded-2xl p-4 border border-zinc-800 w-full">
                <span className={`text-[10px] font-black uppercase tracking-wider mb-2 ${match.estado === 'en_curso' ? 'text-[#00F0FF] animate-pulse' : 'text-[#FF004D]'}`}>
                  {match.estado === 'en_curso' ? 'En Vivo' : 'Finalizado'}
                </span>
                <span className="font-black text-4xl text-white tracking-widest">
                  {match.goles_local_reales ?? '-'} - {match.goles_visitante_reales ?? '-'}
                </span>
                {hasVoted && (
                   <p className="text-xs font-bold text-zinc-500 mt-4 uppercase">
                     Tu predicción: {initialLocal} - {initialVisitante}
                   </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <input 
                  type="number" min="0"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-16 h-16 text-center text-3xl font-black text-white bg-zinc-950 rounded-xl border border-zinc-800 focus:border-[#FF004D] outline-none transition-colors duration-150 placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <span className="text-zinc-600 font-black text-2xl">-</span>
                <input 
                  type="number" min="0"
                  value={visitante}
                  onChange={(e) => setVisitante(e.target.value)}
                  className="w-16 h-16 text-center text-3xl font-black text-white bg-zinc-950 rounded-xl border border-zinc-800 focus:border-[#FF004D] outline-none transition-colors duration-150 placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Botón de Guardar */}
          {!isLocked && (
            <button 
              onClick={handleSave}
              disabled={saving || local === '' || visitante === ''}
              className="w-full bg-[#FF004D] text-white font-black py-4 px-4 rounded-xl disabled:opacity-50 hover:shadow-[0_0_20px_rgba(255,0,77,0.4)] text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.98]"
            >
              {saving ? 'Guardando...' : (hasVoted ? 'Actualizar Predicción' : 'Guardar Predicción')}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
