import React from 'react'

// Utilidad para normalizar nombres y facilitar la búsqueda
const normalizeName = (name) => {
  if (!name) return ''
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

// Estructura exacta solicitada por el usuario con alias (español/inglés)
const LEFT_BRACKET = {
  'LAST_32': [
    ['Alemania', 'Paraguay', 'Germany'],
    ['Francia', 'Suecia', 'France', 'Sweden'],
    ['Sudáfrica', 'Canadá', 'South Africa', 'Canada'],
    ['Países Bajos', 'Marruecos', 'Netherlands', 'Morocco'],
    ['Portugal', 'Croacia', 'Croatia'],
    ['España', 'Austria', 'Spain'],
    ['Estados Unidos', 'Bosnia', 'United States', 'USA', 'Bosnia and Herzegovina'],
    ['Bélgica', 'Senegal', 'Belgium']
  ],
  'LAST_16': [
    ['Paraguay', 'Francia', 'France'],
    ['Canadá', 'Marruecos', 'Canada', 'Morocco'],
    ['Portugal', 'España', 'Spain'],
    ['Estados Unidos', 'Bélgica', 'United States', 'USA', 'Belgium']
  ],
  'QUARTER_FINALS': [
    ['Francia', 'Marruecos', 'France', 'Morocco'],
    ['España', 'Bélgica', 'Spain', 'Belgium']
  ],
  'SEMI_FINALS': [
    ['Francia', 'España', 'France', 'Spain']
  ]
}

const RIGHT_BRACKET = {
  'LAST_32': [
    ['Brasil', 'Japón', 'Brazil', 'Japan'],
    ['Noruega', 'Costa de Marfil', 'Norway', 'Ivory Coast'],
    ['México', 'Ecuador', 'Mexico'],
    ['Inglaterra', 'Congo', 'England', 'Congo DR'],
    ['Argentina', 'Cabo Verde', 'Cape Verde'],
    ['Australia', 'Egipto', 'Egypt'],
    ['Suiza', 'Argelia', 'Switzerland', 'Algeria'],
    ['Colombia', 'Ghana']
  ],
  'LAST_16': [
    ['Brasil', 'Noruega', 'Brazil', 'Norway'],
    ['México', 'Inglaterra', 'Mexico', 'England'],
    ['Argentina', 'Egipto', 'Egypt'],
    ['Colombia', 'Suiza', 'Switzerland']
  ],
  'QUARTER_FINALS': [
    ['Noruega', 'Inglaterra', 'Norway', 'England'],
    ['Argentina', 'Suiza', 'Switzerland']
  ],
  'SEMI_FINALS': [
    ['Inglaterra', 'Argentina', 'England']
  ]
}

const FINAL_MATCH = ['España', 'Argentina', 'Spain']
const THIRD_PLACE_MATCH = ['Francia', 'Inglaterra', 'France', 'England']

export default function TournamentBracket({ partidosPorRonda, onMatchClick, userPredictions }) {
  // Función para encontrar el partido en la DB basándose en los alias
  const findMatch = (stageId, aliases) => {
    const matches = partidosPorRonda[stageId] || []
    return matches.find(m => {
      const local = normalizeName(m.equipo_local)
      const vis = normalizeName(m.equipo_visitante)
      // Iteramos sobre combinaciones para ver si este partido pertenece a este nodo
      for (let i = 0; i < aliases.length; i++) {
        for (let j = 0; j < aliases.length; j++) {
           if (i !== j) {
             const k1 = normalizeName(aliases[i])
             const k2 = normalizeName(aliases[j])
             if ((local.includes(k1) && vis.includes(k2)) || (local.includes(k2) && vis.includes(k1))) {
                return m
             }
           }
        }
      }
      return false
    })
  }

  // Generar columnas de la Izquierda
  const leftColumns = [
    { id: 'LAST_32', name: '16avos', matches: LEFT_BRACKET['LAST_32'].map(aliases => findMatch('LAST_32', aliases)) },
    { id: 'LAST_16', name: 'Octavos', matches: LEFT_BRACKET['LAST_16'].map(aliases => findMatch('LAST_16', aliases)) },
    { id: 'QUARTER_FINALS', name: 'Cuartos', matches: LEFT_BRACKET['QUARTER_FINALS'].map(aliases => findMatch('QUARTER_FINALS', aliases)) },
    { id: 'SEMI_FINALS', name: 'Semis', matches: LEFT_BRACKET['SEMI_FINALS'].map(aliases => findMatch('SEMI_FINALS', aliases)) }
  ]

  // Generar columnas de la Derecha (de Semis a 16avos)
  const rightColumns = [
    { id: 'SEMI_FINALS', name: 'Semis', matches: RIGHT_BRACKET['SEMI_FINALS'].map(aliases => findMatch('SEMI_FINALS', aliases)) },
    { id: 'QUARTER_FINALS', name: 'Cuartos', matches: RIGHT_BRACKET['QUARTER_FINALS'].map(aliases => findMatch('QUARTER_FINALS', aliases)) },
    { id: 'LAST_16', name: 'Octavos', matches: RIGHT_BRACKET['LAST_16'].map(aliases => findMatch('LAST_16', aliases)) },
    { id: 'LAST_32', name: '16avos', matches: RIGHT_BRACKET['LAST_32'].map(aliases => findMatch('LAST_32', aliases)) }
  ]

  const centerMatch = findMatch('FINAL', FINAL_MATCH) || (partidosPorRonda['FINAL'] ? partidosPorRonda['FINAL'][0] : null)
  const thirdPlaceMatch = findMatch('THIRD_PLACE', THIRD_PLACE_MATCH) || (partidosPorRonda['THIRD_PLACE'] ? partidosPorRonda['THIRD_PLACE'][0] : null)

  const renderMatchNode = (match, isCenter = false) => {
    // Si el partido no existe o no se sincronizó aún, renderizamos un espacio en blanco para mantener la estructura perfecta
    if (!match) return <div className={`w-[120px] h-[50px] opacity-20 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl`} />
    
    const prediction = userPredictions[match.id]
    const hasVoted = prediction != null && prediction.local !== ''
    const isLocked = match.estado !== 'programado'
    
    return (
      <button 
        onClick={() => onMatchClick(match)}
        className={`w-[150px] bg-zinc-950/90 backdrop-blur-md border ${hasVoted ? 'border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.15)]' : 'border-zinc-800'} rounded-xl p-2.5 flex flex-col justify-center relative hover:bg-zinc-800 hover:scale-[1.1] hover:z-50 transition-all duration-300 ease-[var(--ease-out-emil)] group shadow-xl`}
      >
        {isLocked && (
           <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FF004D] rounded-full border-2 border-zinc-900 shadow-[0_0_5px_rgba(255,0,77,0.8)]"></span>
        )}
        
        {/* Local */}
        <div className="flex justify-between items-center w-full mb-1.5 border-b border-zinc-800/50 pb-1.5">
           <div className="flex items-center gap-2 overflow-hidden">
             {match.escudo_local ? <img src={match.escudo_local} className="w-4 h-4 object-contain" /> : <div className="w-4 h-4 bg-zinc-800 rounded-full" />}
             <span className="text-zinc-200 text-[10px] font-black truncate uppercase">{match.equipo_local}</span>
           </div>
           {isLocked ? (
             <span className="text-white font-black text-xs ml-2 bg-zinc-800 px-1.5 py-0.5 rounded leading-none">{match.goles_local_reales ?? '-'}</span>
           ) : hasVoted ? (
             <span className="text-[#00F0FF] font-black text-xs ml-2">{prediction.local}</span>
           ) : null}
        </div>

        {/* Visitante */}
        <div className="flex justify-between items-center w-full">
           <div className="flex items-center gap-2 overflow-hidden">
             {match.escudo_visitante ? <img src={match.escudo_visitante} className="w-4 h-4 object-contain" /> : <div className="w-4 h-4 bg-zinc-800 rounded-full" />}
             <span className="text-zinc-200 text-[10px] font-black truncate uppercase">{match.equipo_visitante}</span>
           </div>
           {isLocked ? (
             <span className="text-white font-black text-xs ml-2 bg-zinc-800 px-1.5 py-0.5 rounded leading-none">{match.goles_visitante_reales ?? '-'}</span>
           ) : hasVoted ? (
             <span className="text-[#00F0FF] font-black text-xs ml-2">{prediction.visitante}</span>
           ) : null}
        </div>
      </button>
    )
  }

  const renderColumn = (col, alignRight = false) => {
    return (
      <div key={col.id + (alignRight ? 'R' : 'L')} className="flex flex-col h-full relative z-10 px-2 min-w-[160px] flex-1">
        {/* Title */}
        <div className="text-center pt-8 mb-4 h-[60px]">
           <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
             {col.name}
           </span>
        </div>
        {/* Nodos distribuidos con justify-around para simular llaves */}
        <div className="flex flex-col justify-around flex-1 pb-8 relative">
          {col.matches.map((m, i) => (
            <div key={i} className="flex justify-center items-center relative w-full h-full">
               {renderMatchNode(m)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto pb-8 pt-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
      <div className="min-w-[1600px] max-w-full flex justify-between gap-4 items-stretch h-[950px] bg-zinc-950 rounded-[3rem] border border-zinc-800 shadow-2xl relative overflow-hidden mx-auto">
        
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: `radial-gradient(circle at center, #FF004D 0%, transparent 60%),
                                 linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
                                 linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
               backgroundSize: '100% 100%, 20px 20px, 20px 20px'
             }}>
        </div>

        {/* Lado Izquierdo */}
        <div className="flex flex-1 justify-start">
          {leftColumns.map(col => renderColumn(col))}
        </div>

        {/* Centro (Final y Tercer Puesto) */}
        <div className="flex flex-col justify-center items-center px-4 relative z-20 w-[240px]">
           <div className="mb-10 flex flex-col items-center">
             <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full shadow-md mb-4 text-center">
               Copa del Mundo
             </span>
             <span className="text-[#FF004D] font-black text-4xl tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,0,77,0.5)]">
               FINAL
             </span>
           </div>
           
           <div className="transform scale-125 mb-24 relative z-10">
             {renderMatchNode(centerMatch, true)}
           </div>

           {/* Tercer Puesto */}
           <div className="flex flex-col items-center mt-12 relative z-10">
             <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-4 py-1 rounded-full shadow-md mb-3 text-center">
               Tercer Puesto
             </span>
             {renderMatchNode(thirdPlaceMatch, true)}
           </div>

           {/* Glow central */}
           <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00F0FF]/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        </div>

        {/* Lado Derecho */}
        <div className="flex flex-1 justify-end">
          {rightColumns.map(col => renderColumn(col, true))}
        </div>
      </div>
    </div>
  )
}
