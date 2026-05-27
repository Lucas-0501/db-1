import { useState, useEffect } from 'react'
import TablaPosiciones from './components/TablaPosiciones'
import Resultados from './components/Resultados'
import Goleadores from './components/Goleadores'
import DetallePartido from './components/DetallePartido'
import PartidosHoy from './components/PartidosHoy'
import SelectorLiga from './components/SelectorLiga'
import Auth from './components/Auth'
import JugarProde from './components/JugarProde'
import RankingProde from './components/RankingProde'
import Perfil from './components/Perfil'
import MundialMain from './components/Mundial/MundialMain'
import { getUsuarioActual, cerrarSesion } from './lib/supabase'

const TABS = [
  { id: 'posiciones', label: 'Posiciones' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'goleadores', label: 'Goleadores' },
]

export default function App() {
  const [competition, setCompetition] = useState(null)
  const [tab, setTab] = useState('posiciones')
  const [partidoId, setPartidoId] = useState(null)

  // Auth & Navigation State
  const [user, setUser] = useState(null)
  const [appMode, setAppMode] = useState('stats') // 'stats', 'jugar', 'ranking', 'perfil'
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    setAuthLoading(true)
    try {
      const currentUser = await getUsuarioActual()
      setUser(currentUser)
    } catch (e) {
      console.error(e)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    await cerrarSesion()
    setUser(null)
    setAppMode('stats')
  }

  function seleccionar(comp) {
    if (competition?.code === comp.code) {
      setCompetition(null)
    } else {
      setCompetition(comp)
      setTab('posiciones')
    }
  }

  // Si requiere login y no hay user, mostramos auth
  const requiresAuth = ['jugar', 'perfil', 'mundial'].includes(appMode)
  const showAuth = requiresAuth && !user && !authLoading

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${appMode === 'mundial' ? 'bg-black text-white selection:bg-[#00F0FF] mundial-theme' : 'bg-gradient-to-br from-[#E0F7FA] via-[#B2DFDB] to-[#80CBC4] text-gray-900 selection:bg-teal-300'}`}>
      {/* ── Top Navigation Bar ── */}
      <nav className={`py-3 px-4 sm:px-6 transition-all duration-500 z-50 sticky top-0 backdrop-blur-xl ${appMode === 'mundial' ? 'bg-black/80 text-white border-b border-zinc-800' : 'bg-[#013535]/95 text-white shadow-lg'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-hide gap-4">
          
          <div className="flex gap-2 font-semibold text-sm items-center">
            <button onClick={() => setAppMode('stats')} className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${appMode === 'stats' ? 'bg-white/15 text-white shadow-inner' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Próximos Partidos
            </button>
            <button onClick={() => setAppMode('jugar')} className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${appMode === 'jugar' ? 'bg-white/15 text-white shadow-inner' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Jugar Prode
            </button>
            <button onClick={() => setAppMode('ranking')} className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${appMode === 'ranking' ? 'bg-white/15 text-white shadow-inner' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Ranking
            </button>
            <div className="w-px h-6 bg-white/20 mx-2 hidden sm:block"></div>
            <button onClick={() => setAppMode('mundial')} className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-black uppercase flex items-center gap-2 ${appMode === 'mundial' ? 'bg-[#00F0FF]/10 text-[#00F0FF] font-mundial shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00F0FF]/30' : 'text-zinc-400 hover:bg-white/10 hover:text-white font-mundial'}`}>
              <img src="/mundial/copalogo.png" alt="Mundial" className={`w-5 h-5 object-contain ${appMode === 'mundial' ? 'drop-shadow-[0_0_5px_#00F0FF]' : 'opacity-70 grayscale'}`} />
              Mundial
            </button>
          </div>

          <div className="flex gap-3 items-center shrink-0 ml-4">
            {user ? (
              <>
                <button onClick={() => setAppMode('perfil')} className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${appMode === 'perfil' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-gray-200'}`}>
                  <span className="w-7 h-7 bg-gradient-to-tr from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-[#013535] shadow-md">{user.username?.charAt(0).toUpperCase()}</span>
                  <span className="hidden sm:inline">{user.username}</span>
                </button>
                <button onClick={handleLogout} className="text-xs bg-red-500/20 text-red-100 hover:bg-red-500/40 hover:text-white px-3 py-2 rounded-xl transition-colors font-semibold border border-red-500/30">
                  Salir
                </button>
              </>
            ) : (
              <button onClick={() => setAppMode('perfil')} className="text-sm bg-gradient-to-r from-teal-400 to-teal-500 text-[#013535] hover:shadow-lg hover:shadow-teal-500/30 font-bold px-5 py-2 rounded-xl transition-all">
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Header (solo para Stats) ── */}
      {appMode === 'stats' && (
        <header className="sticky top-0 z-40 w-full glass rounded-b-3xl mb-6 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src="/imagen-Photoroom.png" alt="FutScore Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
                <div>
                  <h1 className="text-xl font-bold text-[#013535] leading-none tracking-tight">FutScore</h1>
                  <p className="text-[#024a4a] text-xs font-medium mt-1">
                    {competition ? 'Estadísticas de la liga' : 'Partidos en vivo y resultados'}
                  </p>
                </div>
              </div>
            </div>

            <SelectorLiga onSelect={seleccionar} selectedComp={competition} />

            {competition && (
              <div className="flex gap-2 mt-2 pb-2 overflow-x-auto scrollbar-hide">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 shadow-sm ${tab === t.id
                      ? 'bg-[#013535] text-white shadow-md'
                      : 'bg-white/40 text-gray-700 hover:bg-white/60'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
      )}

      {/* ── Contenido ── */}
      <main className={`flex-1 w-full flex flex-col ${appMode === 'mundial' ? 'p-0' : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-6'}`}>
        {authLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : showAuth ? (
          <Auth onLogin={checkUser} />
        ) : (
          <>
            {appMode === 'stats' && (
              competition ? (
                <div className="animate-fade-in space-y-6">
                  {tab === 'posiciones' && <TablaPosiciones competition={competition.code} nombre={competition.nombre} />}
                  {tab === 'resultados' && <Resultados competition={competition.code} onSelectPartido={setPartidoId} />}
                  {tab === 'goleadores' && <Goleadores competition={competition.code} />}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold text-[#013535] mb-4 px-2">Partidos Destacados</h2>
                  <PartidosHoy onSelectPartido={setPartidoId} />
                </div>
              )
            )}

            {appMode === 'jugar' && user && <JugarProde user={user} />}
            {appMode === 'ranking' && <RankingProde />}
            {appMode === 'perfil' && user && <Perfil user={user} />}
            {appMode === 'mundial' && user && <MundialMain user={user} />}
          </>
        )}
      </main>

      {/* ── Modal detalle de partido ── */}
      {partidoId && (
        <DetallePartido
          partidoId={partidoId}
          onClose={() => setPartidoId(null)}
        />
      )}
    </div>
  )
}
