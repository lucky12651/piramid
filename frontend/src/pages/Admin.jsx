import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Activity,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { adminApi } from '../services/api'
import { cn, formatDate, shortAddress } from '../lib/utils'
import { useAuthStore } from '../store/useAuthStore'
import { ui } from '../components/piramid/ui'

export default function Admin() {
  const me = useAuthStore((s) => s.user)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [txs, setTxs] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  const load = async (query = q) => {
    setLoading(true)
    try {
      const [s, u, t] = await Promise.all([
        adminApi.stats(),
        adminApi.users(query || undefined),
        adminApi.transactions(40),
      ])
      setStats(s.data)
      setUsers(u.data || [])
      setTxs(t.data || [])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleAdmin = async (user) => {
    if (user.id === me?.id) {
      toast.error('You cannot change your own admin role here')
      return
    }
    try {
      await adminApi.updateUser(user.id, { is_admin: !user.is_admin })
      toast.success(user.is_admin ? 'Admin revoked' : 'Promoted to admin')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    }
  }

  const toggleActive = async (user) => {
    if (user.id === me?.id) {
      toast.error('You cannot disable your own account')
      return
    }
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? 'User disabled' : 'User enabled')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    }
  }

  const removeUser = async (user) => {
    if (user.id === me?.id) return
    if (!window.confirm(`Delete user ${user.username}? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(user.id)
      toast.success('User deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    }
  }

  const statCards = [
    { label: 'Total users', value: stats?.total_users, icon: Users },
    { label: 'Active', value: stats?.active_users, icon: Activity },
    { label: 'Admins', value: stats?.admin_users, icon: Shield },
    { label: 'App sends', value: stats?.recent_sends, icon: Wallet },
  ]

  return (
    <div className={cn(ui.page, 'space-y-6')}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-dimmer)]">Control plane</p>
          <h1 className={cn(ui.pageTitle, 'mt-1 mb-0')}>Admin</h1>
          <p className={cn(ui.sub, 'mb-0 mt-1')}>Manage users, roles, and platform activity</p>
        </div>
        <button onClick={() => load()} className={ui.ghostBtn} disabled={loading} style={{ flex: '0 0 auto' }}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className={cn(ui.card, 'p-5')}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-dimmer)]">{s.label}</p>
              <s.icon className="h-4 w-4 text-[var(--text-dimmer)]" />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
              {s.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'BTC wallets', value: stats?.wallets_btc },
          { label: 'LTC wallets', value: stats?.wallets_ltc },
          { label: 'DOGE wallets', value: stats?.wallets_doge },
          { label: 'ETH / USDT', value: stats?.wallets_eth },
        ].map((s) => (
          <div key={s.label} className={cn(ui.card, 'px-4 py-3')}>
            <p className="text-xs text-[var(--text-dimmer)]">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text)]">{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="flex w-fit gap-1 rounded-full border border-[var(--line)] bg-[var(--muted-bg)] p-1">
        {[
          { id: 'users', label: 'Users' },
          { id: 'activity', label: 'Send log' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition',
              tab === t.id
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className={cn(ui.card, 'overflow-hidden p-0')}>
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dimmer)]" />
              <input
                className={cn(ui.input, 'pl-10')}
                placeholder="Search username, email, address…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(q)}
              />
            </div>
            <button onClick={() => load(q)} className={ui.ghostBtn} style={{ flex: '0 0 auto' }}>
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Wallets</th>
                  <th>Flags</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="font-medium text-[var(--text)]">{u.username}</p>
                      <p className="text-xs text-[var(--text-dimmer)]">{u.email}</p>
                      <p className="font-mono text-[10px] text-[var(--text-dimmer)]">#{u.id}</p>
                    </td>
                    <td className="font-mono text-[11px] text-[var(--text-dim)]">
                      <div>BTC {shortAddress(u.wallet_address_btc)}</div>
                      <div>LTC {shortAddress(u.wallet_address_ltc)}</div>
                      <div>DOGE {shortAddress(u.wallet_address_doge)}</div>
                      <div>ETH {shortAddress(u.wallet_address_eth)}</div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {u.is_admin && (
                          <span className="rounded-full border border-[var(--line)] bg-[var(--muted-bg)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text)]">
                            Admin
                          </span>
                        )}
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
                            u.is_active !== false
                              ? 'border-[var(--green)]/25 bg-[var(--green-bg)] text-[var(--green)]'
                              : 'border-[var(--red)]/25 bg-[var(--red-bg)] text-[var(--red)]'
                          )}
                        >
                          {u.is_active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-[var(--text-dimmer)]">
                      {formatDate(u.created_at)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => toggleAdmin(u)}
                          className={cn(ui.ghostBtn, 'px-2 py-1 text-xs')}
                          disabled={u.id === me?.id}
                          style={{ flex: '0 0 auto' }}
                        >
                          {u.is_admin ? 'Revoke admin' : 'Make admin'}
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className={cn(ui.ghostBtn, 'px-2 py-1 text-xs')}
                          disabled={u.id === me?.id}
                          style={{ flex: '0 0 auto' }}
                        >
                          {u.is_active !== false ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => removeUser(u)}
                          className="x-btn-danger px-2 py-1 text-xs"
                          disabled={u.id === me?.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-dimmer)]">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className={cn(ui.card, 'overflow-hidden p-0')}>
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="text-sm font-medium text-[var(--text)]">Sends initiated via Piramid</h2>
            <p className="text-xs text-[var(--text-dimmer)]">Local application log (not full chain history)</p>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {txs.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-[var(--text-dimmer)]">No send logs yet</p>
            )}
            {txs.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--text)]">
                    {t.username}{' '}
                    <span className="font-normal text-[var(--text-dimmer)]">sent {t.amount} {t.coin}</span>
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-dimmer)]">
                    → {shortAddress(t.recipient, 10, 8)} · {t.txid ? shortAddress(t.txid, 10, 8) : 'no txid'}
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--text-dimmer)]">
                  <p>{formatDate(t.created_at)}</p>
                  <p className="capitalize">{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
