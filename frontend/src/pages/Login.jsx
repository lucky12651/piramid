import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getApiError } from '../lib/errors'
import AuthLayout from '../components/AuthLayout'
import BrandLogo from '../components/BrandLogo'

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthLayout>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-left">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <BrandLogo size={36} rounded="rounded-xl" />
            <span className="font-semibold tracking-tight">Piramid</span>
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-white/45">Welcome back. Sign in to your workspace.</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form space-y-5">
          <div>
            <label htmlFor="email" className="x-label">Email address</label>
            <input
              id="email"
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
            <label htmlFor="password" className="x-label">Password</label>
            <div className="relative"><input
              id="password"
              type={showPassword ? "text" : "password"}
              className="x-input"
              style={{ paddingRight: 48 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            /><button type="button" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-white/60" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
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
    </AuthLayout>
  )
}
