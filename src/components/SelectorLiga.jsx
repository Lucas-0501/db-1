import { COMPETITIONS } from '../lib/apifootball'

export default function SelectorLiga({ onSelect, selectedComp }) {
  const CompetitionsList = () => (
    <div className="flex gap-3 px-1.5">
      {COMPETITIONS.map((comp) => {
        const isSelected = selectedComp?.code === comp.code;
        return (
          <button
            key={comp.code}
            onClick={() => onSelect(comp)}
            className={`shrink-0 flex items-center gap-2.5 rounded-full px-5 py-2.5 transition-all duration-300 ${
              isSelected
                ? 'glass-dark scale-105 shadow-md'
                : 'glass-light hover:bg-white/80 hover:scale-105 text-gray-700'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0 p-1">
              {comp.emblem ? (
                <img src={comp.emblem} alt={comp.code} className="w-full h-full object-contain drop-shadow-sm" />
              ) : (
                <span className="text-[10px] font-bold text-gray-800">{comp.code.substring(0,2)}</span>
              )}
            </div>
            <span className={`font-semibold text-sm whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-800'}`}>
              {comp.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="w-full relative overflow-hidden group">
      {/* Contenedor para el efecto marquee con pausa en hover */}
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] pb-4 pt-2">
        <CompetitionsList />
        <CompetitionsList />
      </div>
    </div>
  )
}
