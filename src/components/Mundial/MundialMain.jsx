import { useState, useEffect, useRef } from 'react'
import MundialProde from './MundialProde'
import MundialRanking from './MundialRanking'

export default function MundialMain({ user }) {
  const [view, setView] = useState('home') // 'home', 'prode', 'ranking'
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15 // Volumen bajo (15%)
    }
  }, [])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Imágenes de la animación derecha
  const homeImages = [
    '/mundial/cartaarg.png', '/mundial/cartacorea.png', '/mundial/cartaespana.png',
    '/mundial/cartafrancia.png', '/mundial/cartanoruega.png', '/mundial/cartaport.png', '/mundial/copalogo.png'
  ]
  const prodeImages = [
    '/mundial/grupoa.png', '/mundial/grupob.png', '/mundial/grupoc.png', '/mundial/grupod.png',
    '/mundial/grupoe.png', '/mundial/grupof.png', '/mundial/grupog.png', '/mundial/grupoh.png',
    '/mundial/grupoi.png', '/mundial/grupoj.png', '/mundial/grupok.png', '/mundial/grupol.png'
  ]
  const renderImages = view === 'prode' ? prodeImages : homeImages

  return (
    <div className="relative w-full flex-1 overflow-hidden bg-black p-4 sm:p-8 flex flex-col">

      {/* Botón de Audio */}
      <button 
        onClick={toggleAudio}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 bg-black/60 backdrop-blur-sm border border-zinc-700 hover:border-[#00F0FF] p-2.5 rounded-full text-zinc-400 hover:text-[#00F0FF] transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        title={isPlaying ? "Pausar música" : "Reproducir música"}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      {/* Audio en loop (Canción del mundial) */}
      <audio ref={audioRef} src="/mundial/cancion.mp3" autoPlay loop className="hidden" />

      {/* Efectos de fondo (luces flúor) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00F0FF] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF004D] rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      {/* Animación vertical IZQUIERDA */}
      <div className={`absolute left-2 lg:left-8 top-0 h-full overflow-hidden opacity-20 pointer-events-none hidden md:block mask-vertical-fade z-0 ${view === 'prode' ? 'w-16 lg:w-20' : 'w-24 lg:w-32'}`}>
        <div className="animate-marquee-vertical flex flex-col gap-6 lg:gap-8" style={{ animationDelay: '-10s', animationDuration: view === 'prode' ? '50s' : '20s' }}>
          {[...renderImages].reverse().map((src, i) => (
            <img key={`img1-l-${i}`} src={src} alt="Decoración Mundial" className="w-full object-contain drop-shadow-2xl" />
          ))}
          {[...renderImages].reverse().map((src, i) => (
            <img key={`img2-l-${i}`} src={src} alt="Decoración Mundial" className="w-full object-contain drop-shadow-2xl" />
          ))}
        </div>
      </div>

      {/* Animación vertical DERECHA */}
      <div className={`absolute right-2 lg:right-8 top-0 h-full overflow-hidden opacity-20 pointer-events-none hidden md:block mask-vertical-fade z-0 ${view === 'prode' ? 'w-16 lg:w-20' : 'w-24 lg:w-32'}`}>
        <div className="animate-marquee-vertical flex flex-col gap-6 lg:gap-8" style={{ animationDuration: view === 'prode' ? '50s' : '20s' }}>
          {renderImages.map((src, i) => (
            <img key={`img1-r-${i}`} src={src} alt="Decoración Mundial" className="w-full object-contain drop-shadow-2xl" />
          ))}
          {/* Duplicado para efecto infinito */}
          {renderImages.map((src, i) => (
            <img key={`img2-r-${i}`} src={src} alt="Decoración Mundial" className="w-full object-contain drop-shadow-2xl" />
          ))}
        </div>
      </div>

      {/* VISTA: LANDING PAGE */}
      {view === 'home' && (
        <div className="flex-1 flex flex-col items-center justify-center z-10 animate-fade-in relative w-full px-4 py-8 sm:py-12">
          {/* Contenedor central proporcionado para el GIF */}
          <div className="relative w-full max-w-[800px] mx-auto group mb-8 md:mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] to-[#FF004D] rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            <img
              src="/466f4d248703551.69f81c6767950.gif"
              alt="FIFA World Cup 2026"
              className="relative w-full h-auto max-h-[500px] object-contain rounded-3xl shadow-2xl border border-zinc-800 bg-black/50"
            />
          </div>

          <div className="flex flex-col items-center max-w-3xl mx-auto w-full pb-10">
            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 text-center uppercase tracking-tighter drop-shadow-lg mb-4">
              La copa está acá
            </h2>
            <p className="text-zinc-400 font-medium text-lg md:text-xl mt-2 text-center max-w-xl mb-10">
              Demostrá cuánto sabés de fútbol en el torneo más grande del mundo.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-4">
              <button
                onClick={() => setView('prode')}
                className="flex-1 bg-white text-black py-5 px-8 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 text-center border-2 border-white"
              >
                Hacé tu Prode
              </button>
              <button
                onClick={() => setView('ranking')}
                className="flex-1 bg-transparent border-2 border-zinc-700 text-white py-5 px-8 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-300 hover:border-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:-translate-y-1 text-center"
              >
                Ver Puntuaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTAS: PRODE / RANKING */}
      {view !== 'home' && (
        <div className="flex-1 flex flex-col z-10 animate-fade-in w-full max-w-5xl mx-auto">
          {/* Header interior */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-zinc-800 pt-4 gap-4">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-zinc-400 font-bold hover:text-white transition-colors uppercase tracking-widest text-sm bg-white/5 px-4 py-2 rounded-lg"
            >
              <span>←</span> Volver al Home
            </button>

            <div className="flex gap-2 bg-black p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setView('prode')}
                className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-300 ${view === 'prode' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-transparent text-zinc-500 hover:text-white'
                  }`}
              >
                Prode
              </button>
              <button
                onClick={() => setView('ranking')}
                className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-300 ${view === 'ranking' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-transparent text-zinc-500 hover:text-white'
                  }`}
              >
                Ranking
              </button>
            </div>
          </div>

          {/* Contenedor dinámico */}
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
            {view === 'prode' ? <MundialProde user={user} /> : <MundialRanking />}
          </div>
        </div>
      )}

    </div>
  )
}
