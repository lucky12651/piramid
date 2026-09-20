import { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { getApiError } from '../lib/errors'
import BinancePage, { Faq } from '../components/layout/BinancePage'
import { ui } from '../components/piramid/ui'

export default function SettingsProfile() {
  const user = useAuthStore((s) => s.user)
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loadingPw, setLoadingPw] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoadingPw(true)
    try {
      await authApi.changePassword({
        current_password: pw.current_password,
        new_password: pw.new_password,
      })
      toast.success('Password updated')
      setPw({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(getApiError(err, 'Failed to change password'))
    } finally {
      setLoadingPw(false)
    }
  }

  return (
    <BinancePage
      crumb="Profile"
      title="Profile"
      sub="Account details and password."
      aside={
        <Faq
          items={[
            { q: 'Can I change my email here?', a: 'Username and email are set at registration. Use password change if you need to secure the account.' },
            { q: 'Password rules?', a: 'Use at least 6 characters. You will stay signed in after a successful change.' },
          ]}
        />
      }
    >
      <div className={ui.panel} style={{ marginBottom: 16 }}>
        <div className={ui.row}>
          <div className={ui.label}>Username</div>
          <div className={ui.input}>{user?.username || '—'}</div>
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Email</div>
          <div className={ui.input}>{user?.email || '—'}</div>
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Role</div>
          <div className={ui.input}>{user?.is_admin ? 'Administrator' : 'User'}</div>
        </div>
        {user?.created_at && (
          <div className={ui.row}>
            <div className={ui.label}>Joined</div>
            <div className={ui.input}>{new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>

      <form className={ui.panel} onSubmit={changePassword}>
        <div className={ui.label} style={{ marginBottom: 16 }}>Change password</div>
        <div className={ui.row}>
          <div className={ui.label}>Current password</div>
          <input
            type="password"
            className={ui.input}
            value={pw.current_password}
            onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
            required
            autoComplete="current-password"
          />
        </div>
        <div className={ui.row}>
          <div className={ui.label}>New password</div>
          <input
            type="password"
            className={ui.input}
            value={pw.new_password}
            onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Confirm new password</div>
          <input
            type="password"
            className={ui.input}
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" disabled={loadingPw} className={ui.submit}>
          {loadingPw ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </BinancePage>
  )
}
