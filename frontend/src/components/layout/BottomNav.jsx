import { NavLink } from 'react-router-dom'
import { ArrowUpRight, LayoutDashboard, QrCode, Receipt, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ui } from '../piramid/ui'

const tabs = [
  { to: '/app', end: true, label: 'Home', icon: LayoutDashboard },
  { to: '/app/activity', label: 'Activity', icon: Receipt },
  { to: '/app/send', label: 'Send', icon: ArrowUpRight, primary: true },
  { to: '/app/receive', label: 'Receive', icon: QrCode },
  { to: '/app/settings/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--sidebar-bg)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {tabs.map(({ to, end, label, icon: Icon, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 text-[10px] font-semibold text-[var(--text-dimmer)]',
              isActive && 'text-[var(--text)]',
              primary && '-mt-3.5'
            )
          }
        >
          {primary ? (
            <>
              <span className={cn(ui.deposit, 'h-12 w-12 justify-center rounded-full p-0 shadow-glow')}>
                <Icon size={20} strokeWidth={2.25} />
              </span>
              {label}
            </>
          ) : (
            <>
              <Icon size={20} strokeWidth={1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
