import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { ui } from '../piramid/ui'

export const TRANSFER_TABS = [
  { to: '/app/send', label: 'Withdraw' },
  { to: '/app/receive', label: 'Deposit' },
  { to: '/app/swap', label: 'Trade' },
]

export function TransferTabs() {
  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--line)]">
      {TRANSFER_TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => cn(ui.tab, isActive && ui.tabOn)}
        >
          {t.label}
        </NavLink>
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
  return (
    <div className={ui.page}>
      <div className={ui.crumb}>
        <Link to="/app">Piramid</Link>
        <span>/</span>
        <span>{crumb}</span>
      </div>
      <h1 className={ui.pageTitle}>{title}</h1>
      {sub && <p className={ui.sub}>{sub}</p>}
      {tabs}
      {wide || !aside ? (
        children
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <div>{children}</div>
          <aside className="flex flex-col gap-4">{aside}</aside>
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
