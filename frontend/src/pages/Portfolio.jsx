import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { walletApi } from '../services/api'
import { formatBalance, formatUsd, coinMeta } from '../lib/utils'
import { WALLET_COINS } from '../lib/coins'
import { useWalletStore } from '../store/useWalletStore'
import { readPriceCache } from '../lib/priceCache'
import CoinIcon from '../components/piramid/CoinIcon'
import Change from '../components/piramid/Change'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'
import { useOutletContext } from 'react-router-dom'

const COLORS = ['#d7f24c', '#627eea', '#f7931a', '#3ddc84', '#f0b90b']

export default function Portfolio() {
  const hideBalances = useWalletStore((s) => s.hideBalances)
  const { prices: ctxPrices } = useOutletContext() || {}
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const prices = Array.isArray(ctxPrices) && ctxPrices.length ? ctxPrices : readPriceCache()

  useEffect(() => {
    setLoading(true)
    walletApi
      .balances()
      .then((r) => setBalances(r.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const priceMap = useMemo(() => {
    const m = {}
    for (const p of prices) m[(p.symbol || '').toUpperCase()] = p
    return m
  }, [prices])

  const tokens = useMemo(() => {
    return WALLET_COINS.map((c) => {
      const bal = Number(balances[c]?.balance || 0)
      const px = priceMap[c]
      const usd = bal * Number(px?.price_usd || 0)
      return {
        symbol: c,
        name: coinMeta(c).name,
        balance: bal,
        usd,
        change: Number(px?.change_24h || 0),
        price: Number(px?.price_usd || 0),
      }
    }).sort((a, b) => b.usd - a.usd)
  }, [balances, priceMap])

  const totalUsd = tokens.reduce((s, t) => s + t.usd, 0)
  const alloc = tokens.filter((t) => t.usd > 0)
  const mask = (v) => (hideBalances ? '••••••' : v)

  const pnl24 = tokens.reduce((s, t) => {
    const ch = t.change / 100
    if (!Number.isFinite(ch) || !t.usd) return s
    return s + t.usd * (ch / (1 + ch))
  }, 0)

  return (
    <div className={ui.page}>
      <div className={ui.crumb}>
        <Link to="/app">Dashboard</Link>
        <span className="sep">/</span>
        <span>Portfolio</span>
      </div>
      <h1 className={ui.pageTitle}>My Portfolio</h1>
      <p className={ui.sub}>Holdings, allocation, and 24h performance across your wallets.</p>

      <div className="pf-hero">
        <section className={ui.card}>
          <div className="card-head">
            <div className="card-head-left">
              <div className={ui.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <span className={ui.title}>Total value</span>
            </div>
          </div>
          <div className={ui.amount}>{loading ? '…' : mask(formatUsd(totalUsd))}</div>
          <div className="portfolio-perf" style={{ marginTop: 14 }}>
            <div className={`perf-badge ${pnl24 >= 0 ? '' : 'neg'}`}>
              {pnl24 >= 0 ? '+' : ''}
              {hideBalances ? '••••' : formatUsd(pnl24)}
            </div>
            <div className="perf-label">Profit in last 24 hours</div>
          </div>
        </section>

        <section className={ui.card}>
          <div className={ui.title} style={{ marginBottom: 16 }}>Allocation</div>
          {alloc.length === 0 ? (
            <p className={ui.sub}>No balances yet — deposit to start building a book.</p>
          ) : (
            <div className="alloc-wrap">
              <svg width="96" height="96" viewBox="0 0 36 36">
                {(() => {
                  let off = 0
                  const sum = alloc.reduce((s, t) => s + t.usd, 0) || 1
                  return alloc.map((t, i) => {
                    const pct = (t.usd / sum) * 100
                    const el = (
                      <circle
                        key={t.symbol}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth="4"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={-off}
                        transform="rotate(-90 18 18)"
                      />
                    )
                    off += pct
                    return el
                  })
                })()}
              </svg>
              <div className="alloc-legend">
                {alloc.map((t, i) => (
                  <div key={t.symbol} className="alloc-leg">
                    <span className="alloc-sw" style={{ background: COLORS[i % COLORS.length] }} />
                    {t.symbol} {totalUsd ? ((t.usd / totalUsd) * 100).toFixed(0) : 0}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className={ui.tableWrap} style={{ marginTop: 18 }}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>Holdings</th>
              <th>Value</th>
              <th>24h</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.symbol}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                    <CoinIcon symbol={t.symbol} />
                    {t.name}
                    <span style={{ color: 'var(--text-dimmer)', fontWeight: 600 }}>{t.symbol}</span>
                  </span>
                </td>
                <td>{formatUsd(t.price)}</td>
                <td>{hideBalances ? '••••' : `${formatBalance(t.balance, 8)} ${t.symbol}`}</td>
                <td style={{ fontWeight: 700 }}>{mask(formatUsd(t.usd))}</td>
                <td>
                  <Change value={t.change} />
                </td>
                <td>
                  <Link to="/app/send" className={ui.link}>Send</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
