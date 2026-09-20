import { cn } from '../../lib/utils'

export default function Change({ value, className = '' }) {
  const n = Number(value)
  const pos = !Number.isFinite(n) ? true : n >= 0
  const label = Number.isFinite(n) ? `${Math.abs(n).toFixed(2)}%` : '—'
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-0.5 text-[11.5px] font-bold',
        pos ? 'text-gain light:text-[#12985a]' : 'text-loss light:text-[#d64545]',
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-[11px] w-[11px]">
        <path d={pos ? 'M4 15l6-6 4 4 6-8' : 'M4 9l6 6 4-4 6 8'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </div>
  )
}
