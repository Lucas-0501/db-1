import { useState } from 'react'
import { iniciarSesion, registrarUsuario } from '../lib/supabase'

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const data = await iniciarSesion(email, password)
        if (data.user) onLogin()
      } else {
        if (!username) throw new Error('El nombre de usuario es obligatorio para el registro.')
        const data = await registrarUsuario(email, password, username)
        if (data.user) onLogin()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="glass-light p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-[#013535] tracking-tighter">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[#024a4a] mt-2 font-medium">
            {isLogin ? 'Ingresa para jugar al Prode' : 'Únete y compite en el ranking'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[#013535] text-sm font-bold mb-1.5 ml-1">Usuario</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/70 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#013535] focus:bg-white transition-all shadow-inner outline-none"
                placeholder="Ej: Futbolero99"
              />
            </div>
          )}

          <div>
            <label className="block text-[#013535] text-sm font-bold mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#013535] focus:bg-white transition-all shadow-inner outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-[#013535] text-sm font-bold mb-1.5 ml-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#013535] focus:bg-white transition-all shadow-inner outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#013535] to-[#024a4a] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? 'Ingresar' : 'Registrarse'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className="text-[#024a4a] hover:text-[#013535] text-sm font-bold transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
