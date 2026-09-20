import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Lock } from 'lucide-react'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import { useWalletStore } from '../../store/useWalletStore'
import { getApiError } from '../../lib/errors'
import BrandLogo from '../BrandLogo'

/**
 * Full-screen lock gate — same layout language as the Login page.
 */
export default function LockScreen() {
  const user = useAuthStore((s) => s.user)
  const unlock = useWalletStore((s) => s.unlock)
  const logout = useAuthStore((s) => s.logout)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const onUnlock = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.login({ email: user.email, password })
      unlock()
      toast.success('Wallet unlocked')
    } catch (err) {
      toast.error(getApiError(err, 'Wrong password'))
    } finally {
      setLoading(false)
    }
  }

  const onSignOut = () => {
    unlock()
    logout()
    window.location.href = '/login'
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="lock-screen-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      {/* Full pure-dark background (login-style) */}
      <div className="lock-screen-bg" aria-hidden="true" />
      <div className="lock-screen-grid" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md px-1">
        {/* Brand — same as Login: logo + Piramid text */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 text-white">
            <BrandLogo size={36} rounded="rounded-xl" />
            <span className="text-base font-semibold tracking-tight text-white">
              Piramid
            </span>
          </div>

          <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#d7f24c]/30 bg-[#d7f24c]/10">
            <Lock className="h-5 w-5 text-[#d7f24c]" />
          </div>

          <h1
            id="lock-title"
            className="mt-4 text-2xl font-semibold tracking-tight text-white"
          >
            Wallet locked
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Enter your password to unlock
            {user?.username ? (
              <>
                {' '}
                <span className="text-white/70">{user.username}</span>
              </>
            ) : (
              ' your account'
            )}
          </p>
        </div>

        {/* Glass card — green-tinted only on the card */}
        <form onSubmit={onUnlock} className="x-card space-y-4 p-6 sm:p-8">
          <div>
            <label className="x-label" htmlFor="lock-password">
              Password
            </label>
            <input
              id="lock-password"
              type="password"
              className="x-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="x-btn-primary w-full py-3">
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          <button
            type="button"
            onClick={onSignOut}
            className="text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            Sign out instead
          </button>
        </p>
      </div>
    </div>,
    document.body
  )
}
