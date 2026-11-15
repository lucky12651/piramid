import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getApiError } from '../lib/errors'
import AuthLayout from '../components/AuthLayout'
import BrandLogo from '../components/BrandLogo'

export default function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    agree_terms: true,
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.agree_terms) {
      toast.error('You must agree to the terms')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setSession(data.access_token, data.user)
      toast.success('Wallet created — welcome to Piramid')
      navigate('/app')
    } catch (err) {
      toast.error(getApiError(err, 'Registration failed'))
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
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your wallet</h1>
          <p className="mt-2 text-sm text-white/45">
            Generates BTC, LTC, ETH, DOGE & USDT wallets (may take 30–60s)
          </p>
        </div>

        <form onSubmit={onSubmit} className="auth-form space-y-5">
          <div>
            <label htmlFor="username" className="x-label">Username</label>
            <input
              className="x-input"
              id="username"
              autoComplete="username"
              value={form.username}
              onChange={set('username')}
              required
              minLength={3}
              placeholder="satoshi"
            />
          </div>
          <div>
            <label htmlFor="email" className="x-label">Email address</label>
            <input
              id="email"
              type="email"
              className="x-input"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="x-label">Password</label>
            <input
              id="password"
              type="password"
              className="x-input"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              placeholder="Min. 8 characters"
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-white/50">
            <input
              type="checkbox"
              checked={form.agree_terms}
              onChange={set('agree_terms')}
              className="mt-1"
            />
            I understand this is a self-custody style demo wallet and I am responsible for my keys.
          </label>
          <button type="submit" disabled={loading} className="x-btn-primary w-full py-3">
            {loading ? 'Creating wallets… please wait' : 'Create account'}
          </button>
          {loading && (
            <p className="text-center text-xs text-white/40">
              Building multi-chain wallets — do not close this page.
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
