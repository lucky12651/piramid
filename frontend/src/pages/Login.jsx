import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getApiError } from '../lib/errors'
import BrandLogo from '../components/BrandLogo'

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      setSession(data.access_token, data.user)
      toast.success('Welcome back')
      navigate(data.user?.is_admin ? '/app/admin' : '/app')
    } catch (err) {
      toast.error(getApiError(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <BrandLogo size={36} rounded="rounded-xl" />
            <span className="font-semibold tracking-tight">Piramid</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-white/45">Access your trading terminal</p>
        </div>

        <form onSubmit={onSubmit} className="x-card space-y-4 p-6 sm:p-8">
          <div>
            <label className="x-label">Email</label>
            <input
              type="email"
              className="x-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="x-label">Password</label>
            <input
              type="password"
              className="x-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="x-btn-primary w-full py-3">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          No account?{' '}
          <Link to="/register" className="text-white hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
