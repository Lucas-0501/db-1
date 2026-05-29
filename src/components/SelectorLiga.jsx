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
            className={`shrink-0 flex items-center gap-2.5 rounded-full px-5 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] ${
              isSelected
                ? 'bg-[#013535] text-white shadow-lg scale-[1.02]'
                : 'bg-white border border-black/5 text-zinc-600 hover:bg-zinc-50 hover:scale-[1.02] shadow-sm'
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
