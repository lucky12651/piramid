import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bell,
  Lock,
  LogOut,
  Search,
  Shield,
  User,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useWalletStore } from '../../store/useWalletStore'
import { marketApi } from '../../services/api'
import { formatUsd } from '../../lib/utils'
import { readPriceCache, writePriceCache } from '../../lib/priceCache'
import { cn } from '../../lib/utils'
import BrandLogo from '../BrandLogo'
import BottomNav from './BottomNav'
import LockScreen from './LockScreen'
import CoinIcon from '../piramid/CoinIcon'
import Change from '../piramid/Change'
import { ui } from '../piramid/ui'

const nav = [
  {
    to: '/app',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/app/market',
    label: 'Market',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="12" y="9" width="4" height="11" rx="1.2" />
        <rect x="18" y="6" width="3" height="14" rx="1.2" />
      </svg>
    ),
  },
  {
    to: '/app/swap',
    label: 'Trade',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 7h10M17 7l-3-3M17 7l-3 3M17 17H7M7 17l3-3M7 17l3 3" />
      </svg>
    ),
  },
  {
    to: '/app/portfolio',
    label: 'Portfolio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
  {
    to: '/app/calendar',
    label: 'Economic Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
      </svg>
    ),
  },
]

const PAGES = [
  { to: '/app', label: 'Dashboard', hint: 'Live trading home' },
  { to: '/app/market', label: 'Market', hint: 'Live prices' },
  { to: '/app/swap', label: 'Trade', hint: 'Convert assets' },
  { to: '/app/portfolio', label: 'Portfolio', hint: 'Holdings & allocation' },
  { to: '/app/calendar', label: 'Economic Calendar', hint: 'Macro events' },
  { to: '/app/send', label: 'Withdraw', hint: 'Send crypto' },
  { to: '/app/receive', label: 'Deposit', hint: 'Address & QR' },
  { to: '/app/activity', label: 'Activity', hint: 'Transaction history' },
  { to: '/app/nfts', label: 'NFTs', hint: 'Collectibles' },
  { to: '/app/contacts', label: 'Contacts', hint: 'Address book' },
  { to: '/app/alerts', label: 'Price alerts', hint: 'Notify on targets' },
  { to: '/app/connect', label: 'Connected dApps', hint: 'Sessions' },
  { to: '/app/browser', label: 'Discover', hint: 'Web3 apps' },
  { to: '/app/settings/security', label: 'Security', hint: 'Backup & keys' },
]

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const refreshMe = useAuthStore((s) => s.refreshMe)
  const locked = useWalletStore((s) => s.locked)
  const lock = useWalletStore((s) => s.lock)
  const favoriteTokens = useWalletStore((s) => s.favoriteTokens)
  const contacts = useWalletStore((s) => s.contacts)
  const alerts = useWalletStore((s) => s.alerts)
  const notifications = useWalletStore((s) => s.notifications)
  const autoLockMinutes = useWalletStore((s) => s.autoLockMinutes)
  const lastActive = useWalletStore((s) => s.lastActive)
  const theme = useWalletStore((s) => s.theme)
  const setTheme = useWalletStore((s) => s.setTheme)
  const touch = useWalletStore((s) => s.touch)
  const markAlertTriggered = useWalletStore((s) => s.markAlertTriggered)
  const pushNotification = useWalletStore((s) => s.pushNotification)
  const markNotificationsRead = useWalletStore((s) => s.markNotificationsRead)
  const navigate = useNavigate()
  const location = useLocation()

  const [prices, setPrices] = useState(() => readPriceCache())
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [premiumOpen, setPremiumOpen] = useState(() => localStorage.getItem('vx_premium') !== '0')

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  useEffect(() => {
    const light = theme === 'light'
    document.documentElement.classList.toggle('theme-light', light)
    document.documentElement.classList.toggle('dark', !light)
    document.documentElement.style.colorScheme = light ? 'light' : 'dark'
    document.body.style.background = light ? '#e8ece3' : '#0a0a0c'
    document.body.style.color = light ? '#1a1f16' : '#f5f5f7'
  }, [theme])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('theme-light')
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      document.body.style.background = '#0a0a0c'
      document.body.style.color = '#f5f5f7'
    }
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
    setQuery('')
  }, [location.pathname])

  useEffect(() => {
    const onAct = () => touch()
    window.addEventListener('pointerdown', onAct)
    window.addEventListener('keydown', onAct)
    return () => {
      window.removeEventListener('pointerdown', onAct)
      window.removeEventListener('keydown', onAct)
    }
  }, [touch])

  useEffect(() => {
    if (!autoLockMinutes) return undefined
    const id = setInterval(() => {
      const idle = Date.now() - useWalletStore.getState().lastActive
      if (idle > autoLockMinutes * 60_000) lock()
    }, 10_000)
    return () => clearInterval(id)
  }, [autoLockMinutes, lastActive, lock])

  useEffect(() => {
    let alive = true
    const load = () => {
      marketApi
        .prices()
        .then((r) => {
          const list = Array.isArray(r.data) ? r.data : []
          if (!alive || !list.length) return
          writePriceCache(list)
          setPrices(list)
        })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!prices.length || !alerts.length) return
    const map = {}
    for (const p of prices) map[(p.symbol || '').toUpperCase()] = Number(p.price_usd)
    for (const a of alerts) {
      if (a.triggered) continue
      const px = map[a.symbol]
      if (!Number.isFinite(px) || !Number.isFinite(a.target)) continue
      const hit = a.dir === 'below' ? px <= a.target : px >= a.target
      if (!hit) continue
      markAlertTriggered(a.id)
      pushNotification({
        title: `${a.symbol} alert`,
        body: `${a.symbol} is ${formatUsd(px)} (${a.dir} ${formatUsd(a.target)})`,
        to: '/app/alerts',
      })
      toast.success(`${a.symbol} hit ${formatUsd(a.target)}`)
    }
  }, [prices, alerts, markAlertTriggered, pushNotification])

  const watchlist = useMemo(() => {
    const wanted = favoriteTokens.length ? favoriteTokens : ['BTC', 'ETH', 'SOL']
    const bySym = {}
    for (const p of prices) bySym[(p.symbol || '').toUpperCase()] = p
    return wanted.map((s) => bySym[s]).filter(Boolean)
  }, [prices, favoriteTokens])

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []
    const pages = PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q)
    ).slice(0, 5)
    const toks = prices
      .filter(
        (p) =>
          (p.symbol || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
    const people = contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
      )
      .slice(0, 4)
    return { pages, toks, people }
  }, [query, prices, contacts])

  const unread = notifications.filter((n) => !n.read).length
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = ((user?.username || 'U').slice(0, 2) || 'U').toUpperCase()
  const isDashboard = location.pathname === '/app' || location.pathname === '/app/'
  const showSearch = query.trim().length > 0

  if (locked) {
    return <LockScreen />
  }

  return (
    <div className={cn(ui.shell, theme === 'light' && 'theme-light')}>
      <aside className={ui.sidebar}>
        <Link to="/app" className={ui.logo}>
          <BrandLogo size={34} />
          <div>
            <div className={ui.logoText}>Piramid</div>
            <div className={ui.logoSub}>Trade at the Speed of Now</div>
          </div>
        </Link>

        <nav className={ui.nav}>
          {nav.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(ui.navItem, isActive && ui.navOn)}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={ui.wlHead}>
          MY WATCHLIST
          <Link to="/app/market" aria-label="Edit watchlist" className="text-[var(--text-dimmer)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[15px] w-[15px]">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Link>
        </div>
        <ul className="m-0 flex list-none flex-col gap-[3px] p-0">
          {watchlist.map((c) => (
            <li key={c.symbol} className={ui.wlItem}>
              <CoinIcon symbol={c.symbol} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[var(--text)]">
                  {c.name} ({c.symbol})
                </div>
                <div className="mt-px text-xs text-[var(--text-dimmer)]">{formatUsd(c.price_usd)}</div>
              </div>
              <Change value={c.change_24h} />
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        {premiumOpen && (
          <div className="p-glass relative mt-3.5 rounded-[14px] border border-[#d7f24c]/30 bg-[var(--card)] p-3.5 backdrop-blur-[18px] light:bg-white/90">
            <button
              type="button"
              className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-dimmer)]"
              aria-label="Dismiss"
              onClick={() => {
                setPremiumOpen(false)
                localStorage.setItem('vx_premium', '0')
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className={cn(ui.cardIcon, 'mb-2.5')}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7z" />
              </svg>
            </div>
            <div className="mb-0.5 text-[13px] font-bold">Premium Features</div>
            <div className="mb-2.5 text-[11.5px] leading-snug text-[var(--text-dimmer)]">Unlock advanced indicators, deeper watchlists, and priority execution.</div>
            <Link to="/app/settings/profile" className={cn(ui.submit, 'mt-0 block py-2 text-center text-xs')}>
              Upgrade now
            </Link>
          </div>
        )}
      </aside>

      <div className={ui.main}>
        <header className={ui.topbar}>
          {menuOpen && (
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'transparent', border: 0 }}
            />
          )}
          <div className="relative z-[21] flex cursor-pointer items-center gap-2.5" onClick={() => setMenuOpen((v) => !v)}>
            <img
              className={ui.avatar}
              alt={initials}
              src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(user?.username || 'piramid')}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
            />
            <div>
              <div className="text-[13.5px] font-bold leading-tight">{user?.username || 'Wallet'}</div>
              <div className="text-[11.5px] text-[var(--text-dimmer)]">@{user?.username || 'user'}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="ml-0.5 h-3.5 w-3.5 text-[var(--text-dimmer)]">
              <path d="M6 9l6 6 6-6" />
            </svg>
            {menuOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-[70] min-w-[196px] rounded-xl border border-[var(--line)] bg-[var(--sidebar-bg)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] light:bg-white" onClick={(e) => e.stopPropagation()}>
                <Link to="/app/settings/profile" className={ui.menuItem} onClick={() => setMenuOpen(false)}>
                  <User size={15} /> Profile
                </Link>
                <Link to="/app/settings/security" className={ui.menuItem} onClick={() => setMenuOpen(false)}>
                  <Shield size={15} /> Security
                </Link>
                <Link to="/app/alerts" className={ui.menuItem} onClick={() => setMenuOpen(false)}>
                  <Bell size={15} /> Price alerts
                </Link>
                {user?.is_admin && (
                  <Link to="/app/admin" className={ui.menuItem} onClick={() => setMenuOpen(false)}>
                    <Shield size={15} /> Admin
                  </Link>
                )}
                <button
                  type="button"
                  className={ui.menuItem}
                  onClick={() => {
                    setMenuOpen(false)
                    lock()
                  }}
                >
                  <Lock size={15} /> Lock wallet
                </button>
                <button type="button" className={cn(ui.menuItem, 'text-loss')} onClick={handleLogout}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>

          <Link to="/app/receive" className={ui.deposit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M2 10h20M7 15h3" />
            </svg>
            Deposit
          </Link>

          <div className="flex-1" />

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={ui.iconBtn}
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v)
                markNotificationsRead()
              }}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-extrabold text-[var(--ink)]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className={ui.pop}>
                <div className="px-2.5 py-2 text-[10.5px] font-bold tracking-wider text-[var(--text-dimmer)]">NOTIFICATIONS</div>
                {notifications.length === 0 && (
                  <div style={{ padding: 14, fontSize: 13, color: 'var(--text-dimmer)' }}>No alerts yet</div>
                )}
                {notifications.slice(0, 8).map((n) => (
                  <Link key={n.id} to={n.to || '/app'} onClick={() => setNotifOpen(false)}>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    <span>
                      <b style={{ color: 'var(--text)', fontWeight: 650 }}>{n.title}</b>
                      <div style={{ fontSize: 12, marginTop: 2 }}>{n.body}</div>
                    </span>
                  </Link>
                ))}
                <Link to="/app/alerts" onClick={() => setNotifOpen(false)} style={{ justifyContent: 'center', color: '#d7f24c' }}>
                  Manage price alerts
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <div className={ui.search}>
              <Search size={15} />
              <input
                type="text"
                className="w-full bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-dimmer)]"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {showSearch && (
              <div className={cn(ui.pop, 'left-auto right-0 w-[360px]')}>
                {searchHits.pages?.map((p) => (
                  <Link key={p.to} to={p.to} onClick={() => setQuery('')}>
                    <span>
                      <b style={{ color: 'var(--text)' }}>{p.label}</b>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{p.hint}</div>
                    </span>
                  </Link>
                ))}
                {searchHits.toks?.map((t) => (
                  <Link key={t.symbol} to="/app/market" onClick={() => setQuery('')}>
                    <CoinIcon symbol={t.symbol} />
                    <span>
                      <b style={{ color: 'var(--text)' }}>{t.name}</b>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{formatUsd(t.price_usd)}</div>
                    </span>
                  </Link>
                ))}
                {searchHits.people?.map((c) => (
                  <Link key={c.id} to="/app/send" onClick={() => setQuery('')}>
                    <span>
                      <b style={{ color: 'var(--text)' }}>{c.name}</b>
                      <div style={{ fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>
                        {c.coin} · {c.address.slice(0, 10)}…
                      </div>
                    </span>
                  </Link>
                ))}
                {!searchHits.pages?.length && !searchHits.toks?.length && !searchHits.people?.length && (
                  <div style={{ padding: 14, fontSize: 13, color: 'var(--text-dimmer)' }}>No matches</div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#d7f24c] p-1 shadow-glow" role="group" aria-label="Theme">
            <button
              type="button"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                theme === 'light' ? 'bg-[#12160f] text-[#d7f24c]' : 'text-[#12160f]'
              )}
              onClick={() => setTheme('light')}
              aria-label="Light mode"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full',
                theme === 'dark' ? 'bg-[#12160f] text-[#d7f24c]' : 'text-[#12160f]'
              )}
              onClick={() => setTheme('dark')}
              aria-label="Dark mode"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
            </button>
          </div>
        </header>

        <div className={isDashboard ? '' : 'min-w-0 flex-1'}>
          <Outlet context={{ searchQuery: query, prices }} />
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
