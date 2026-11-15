import { createContext, useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { ui } from '../piramid/ui'

export const TransferModalContext = createContext(false)

export const TRANSFER_TABS = [
  { to: '/app/send', label: 'Withdraw' },
  { to: '/app/receive', label: 'Deposit' },
]

export function TransferTabs() {
  const modal = useContext(TransferModalContext)
  const TabLink = modal ? Link : NavLink
  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--line)]">
      {TRANSFER_TABS.map((t) => (
        <TabLink
          key={t.to}
          to={t.to}
          replace={modal}
          aria-current={modal && ((modal === 'deposit') === (t.to === '/app/receive')) ? 'page' : undefined}
          className={modal ? cn(ui.tab, ((modal === 'deposit') === (t.to === '/app/receive')) && ui.tabOn) : ({ isActive }) => cn(ui.tab, isActive && ui.tabOn)}
        >
          {t.label}
        </TabLink>
      ))}
    </div>
  )
}

export default function BinancePage({
  crumb = 'Wallet',
  title,
  sub,
  tabs,
  aside,
  children,
  wide = false,
}) {
  const modal = useContext(TransferModalContext)
  if (modal) return <div className="transfer-content">
    {sub && <p className="mb-5 text-sm text-[var(--text-dim)]">{sub}</p>}
    {tabs}
    {children}
    {aside && <aside className="mt-4 flex flex-col gap-4">{aside}</aside>}
  </div>
  return (
    <div className={ui.page}>
      <header className="mb-6">
        <div className={ui.crumb}>
          <Link to="/app">Piramid</Link>
          <span>/</span>
          <span>{crumb}</span>
        </div>
        <h1 className={cn(ui.pageTitle, 'mb-1')}>{title}</h1>
        {sub && <p className={cn(ui.sub, 'mb-0')}>{sub}</p>}
      </header>
      {tabs}
      {wide || !aside ? (
        children
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
          <div className="min-w-0">{children}</div>
          <aside className="flex min-w-0 flex-col gap-4">{aside}</aside>
        </div>
      )}
    </div>
  )
}

export function Faq({ items }) {
  return (
    <div className={ui.side}>
      <h3 className="mb-3 text-base font-bold">FAQ</h3>
      <div className="divide-y divide-[var(--line)]">
        {items.map((it) => (
          <details key={it.q} className="py-3">
            <summary className="cursor-pointer list-none text-[13.5px] font-semibold">{it.q}</summary>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
