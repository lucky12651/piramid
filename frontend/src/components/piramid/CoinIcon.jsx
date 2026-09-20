import { cn } from '../../lib/utils'

const META = {
  BTC: { letter: '₿', color: '#f7931a' },
  ETH: { letter: 'Ξ', color: '#627eea' },
  BNB: { letter: 'B', color: '#f0b90b' },
  SOL: { letter: 'S', color: '#14f195' },
  LTC: { letter: 'Ł', color: '#345d9d' },
  DOGE: { letter: 'Ð', color: '#c2a633' },
  USDT: { letter: 'T', color: '#26a17b' },
  XRP: { letter: 'X', color: '#23292f' },
  ADA: { letter: 'A', color: '#0033ad' },
  AVAX: { letter: 'A', color: '#e84142' },
  DOT: { letter: '●', color: '#e6007a' },
  LINK: { letter: '⬡', color: '#2a5ada' },
  MATIC: { letter: 'M', color: '#8247e5' },
  TRX: { letter: 'T', color: '#ff0013' },
  SHIB: { letter: 'S', color: '#ffa409' },
}

const ICON_CDN =
  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color'

export function coinColor(symbol) {
  return META[(symbol || '').toUpperCase()]?.color || '#d7f24c'
}

export default function CoinIcon({ symbol, className = '' }) {
  const s = (symbol || '').toUpperCase()
  const meta = META[s] || { letter: s[0] || '?', color: '#d7f24c' }
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold text-[#0a0a0c]',
        className
      )}
      style={{ background: meta.color, boxShadow: `0 0 16px ${meta.color}73` }}
    >
      <img
        src={`${ICON_CDN}/${s.toLowerCase()}.svg`}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const fallback = e.currentTarget.nextSibling
          if (fallback) fallback.hidden = false
        }}
      />
      <span hidden>{meta.letter}</span>
    </div>
  )
}
