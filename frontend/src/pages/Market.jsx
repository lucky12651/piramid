import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { marketApi } from '../services/api'
import { formatUsd } from '../lib/utils'
import CoinIcon from '../components/piramid/CoinIcon'
import Change from '../components/piramid/Change'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'
import MarketOverview from '../components/market/MarketOverview'
import { useWalletStore } from '../store/useWalletStore'
import BinancePage from '../components/layout/BinancePage'

export default function Market() {
  const [prices, setPrices] = useState([])
  const fav = useWalletStore((s) => s.favoriteTokens)
  const toggleFavorite = useWalletStore((s) => s.toggleFavorite)

  useEffect(() => {
    let alive = true
    const load = () => {
      marketApi
        .prices()
        .then((r) => {
          if (alive) setPrices(Array.isArray(r.data) ? r.data : [])
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

  return (
    <BinancePage
      crumb="Markets"
      title="Markets"
      sub="Live prices. Star a coin to pin it on the watchlist."
      wide
    >
      <div className={cn(ui.card, 'mb-6 overflow-hidden p-0')} style={{ background: 'var(--chart-bg)' }}>
        <MarketOverview height={560} />
      </div>
      <div className={ui.tableWrap}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th className="num">Price</th>
              <th className="num">24h</th>
            </tr>
          </thead>
          <tbody>
            {prices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--text-dimmer)]">
                  Loading live prices…
                </td>
              </tr>
            )}
            {prices.map((p) => (
              <tr key={p.symbol}>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p.symbol)}
                    style={{ color: fav.includes(p.symbol) ? 'var(--accent)' : 'var(--text-dimmer)' }}
                    aria-label="Watchlist"
                  >
                    <Star size={16} fill={fav.includes(p.symbol) ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <CoinIcon symbol={p.symbol} /> {p.name}
                    <span style={{ color: 'var(--text-dimmer)', fontWeight: 600 }}>{p.symbol}</span>
                  </span>
                </td>
                <td className="num">{formatUsd(p.price_usd)}</td>
                <td className="num">
                  <Change value={p.change_24h} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link to="/app/calendar" className={ui.link}>Economic calendar →</Link>
      </div>
    </BinancePage>
  )
}
