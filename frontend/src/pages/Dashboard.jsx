import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { EyeOff } from 'lucide-react'
import { marketApi, walletApi } from '../services/api'
import { formatUsd, formatBalance, formatDate, coinMeta, shortAddress } from '../lib/utils'
import { WALLET_COINS } from '../lib/coins'
import { NETWORKS, useWalletStore } from '../store/useWalletStore'
import { readPriceCache, writePriceCache } from '../lib/priceCache'
import TradingViewChart from '../components/market/TradingViewChart'
import CoinIcon, { coinColor } from '../components/piramid/CoinIcon'
import Change from '../components/piramid/Change'
import Sparkline, { synthSpark } from '../components/piramid/Sparkline'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

const INTERVALS = [
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
]

function timeAgo(ts) {
  if (!ts) return 'just now'
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s} seconds ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.round(m / 60)
  return `${h} hour${h === 1 ? '' : 's'} ago`
}

export default function Dashboard() {
  const hideBalances = useWalletStore((s) => s.hideBalances)
  const toggleHideBalances = useWalletStore((s) => s.toggleHideBalances)
  const network = useWalletStore((s) => s.getNetwork())
  const setNetwork = useWalletStore((s) => s.setNetwork)
  const { searchQuery = '', prices: ctxPrices } = useOutletContext() || {}

  const [balances, setBalances] = useState({})
  const [prices, setPrices] = useState(() =>
    Array.isArray(ctxPrices) && ctxPrices.length ? ctxPrices : readPriceCache()
  )
  const [updatedAt, setUpdatedAt] = useState(Date.now())
  const [netOpen, setNetOpen] = useState(false)
  const [chartSymbol, setChartSymbol] = useState('BTC')
  const [interval, setIntervalId] = useState('60')
  const [intervalOpen, setIntervalOpen] = useState(false)
  const [txs, setTxs] = useState([])
  const [picked, setPicked] = useState(null)
  const [, setNow] = useState(Date.now())
  const [tool, setTool] = useState('cross')
  const chartCardRef = useRef(null)
  const netBtnRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!netOpen && !intervalOpen) return undefined
    const onDoc = (e) => {
      if (netBtnRef.current && !netBtnRef.current.contains(e.target)) setNetOpen(false)
      if (!e.target.closest?.('[data-interval-toggle]') && !e.target.closest?.('[data-interval-menu]')) {
        setIntervalOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [netOpen, intervalOpen])

  const loadPrices = () => {
    marketApi
      .prices()
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : []
        if (!list.length) return
        writePriceCache(list)
        setPrices(list)
        setUpdatedAt(Date.now())
      })
      .catch(() => {})
  }

  const loadWallet = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        walletApi.balances(),
        walletApi.transactions(network.symbol === 'USDT' ? 'ETH' : network.symbol).catch(() => ({ data: [] })),
      ])
      setBalances(bRes.data || {})
      setTxs(Array.isArray(tRes.data) ? tRes.data.slice(0, 6) : [])
    } catch {
      /* keep last known balances */
    }
  }

  useEffect(() => {
    if (Array.isArray(ctxPrices) && ctxPrices.length) {
      setPrices(ctxPrices)
      writePriceCache(ctxPrices)
    }
  }, [ctxPrices])

  useEffect(() => {
    loadPrices()
    loadWallet()
    const id = setInterval(() => {
      loadPrices()
      loadWallet()
    }, 60_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.id])

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
      const change = Number(px?.change_24h || 0)
      const spark = Array.isArray(px?.sparkline) && px.sparkline.length
        ? px.sparkline
        : synthSpark(c, change)
      return {
        symbol: c,
        name: coinMeta(c).name,
        balance: bal,
        usd,
        change,
        change30: Number(px?.change_30d ?? px?.change_24h ?? 0),
        price: Number(px?.price_usd || 0),
        spark,
      }
    })
  }, [balances, priceMap])

  const totalUsd = useMemo(() => tokens.reduce((s, t) => s + t.usd, 0), [tokens])

  const pnl24 = useMemo(() => {
    return tokens.reduce((s, t) => {
      const ch = t.change / 100
      if (!Number.isFinite(ch) || !t.usd) return s
      return s + t.usd * (ch / (1 + ch))
    }, 0)
  }, [tokens])

  const avgGrow = useMemo(() => {
    if (!totalUsd) return 0
    return tokens.reduce((s, t) => s + (t.usd / totalUsd) * t.change, 0)
  }, [tokens, totalUsd])

  const best = useMemo(() => {
    const held = tokens.filter((t) => t.usd > 0)
    if (held.length) return [...held].sort((a, b) => b.change - a.change)[0]
    return tokens.find((t) => t.symbol === 'BTC') || tokens[0]
  }, [tokens])

  const pnl30pct = useMemo(() => {
    if (!totalUsd) return 0
    return tokens.reduce((s, t) => s + (t.usd / totalUsd) * t.change30, 0)
  }, [tokens, totalUsd])

  const q = searchQuery.trim().toLowerCase()
  const liveCards = useMemo(() => {
    const preferred = ['BTC', 'ETH', 'BNB']
    const extras = prices.filter((p) => !preferred.includes((p.symbol || '').toUpperCase()))
    const ordered = [
      ...preferred.map((s) => priceMap[s]).filter(Boolean),
      ...extras,
    ]
    const list = ordered.filter((p) => {
      if (!q) return true
      return (
        (p.symbol || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q)
      )
    })
    return list.slice(0, 3)
  }, [priceMap, prices, q])

  const holdings = useMemo(() => {
    const filtered = tokens
      .filter((t) => (q ? t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q) : true))
      .sort((a, b) => b.usd - a.usd)
    const owned = filtered.filter((t) => t.usd > 0 || t.balance > 0)
    if (owned.length) return owned
    const preferred = ['BTC', 'ETH', 'SOL']
    return preferred
      .map((s) => {
        const t = filtered.find((x) => x.symbol === s)
        if (t) return t
        const p = priceMap[s]
        if (!p) return null
        return {
          symbol: s,
          name: p.name || s,
          balance: 0,
          usd: 0,
          change: Number(p.change_24h || 0),
          price: Number(p.price_usd || 0),
        }
      })
      .filter(Boolean)
  }, [tokens, q, priceMap])

  const mask = (v) => (hideBalances ? '••••••' : v)

  const intervalLabel = INTERVALS.find((i) => i.value === interval)?.label || '1H'
  const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  const alloc = holdings.filter((t) => t.usd > 0)
  const COLORS = ['#d7f24c', '#627eea', '#f7931a', '#3ddc84', '#f0b90b']

  return (
    <>
      <div className={ui.page}>
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(240px,300px)] lg:[grid-template-areas:'balance_crypto_crypto'_'chart_chart_portfolio']">
        <section className={cn(ui.card, 'relative z-10 flex flex-col overflow-visible lg:[grid-area:balance]')}>
          <div className="mb-[18px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={ui.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <span className={ui.title}>My Balance</span>
            </div>
            <button type="button" className={ui.expandBtn} onClick={toggleHideBalances} aria-label="Toggle balances">
              {hideBalances ? <EyeOff size={14} /> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              )}
            </button>
          </div>

          <div className="mb-5 flex items-start justify-between gap-3">
            <div className={cn(ui.amount, 'min-w-0 break-all')}>{mask(formatUsd(totalUsd))}</div>
            <div className="relative shrink-0" ref={netBtnRef}>
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-full bg-[var(--muted-bg)] px-3 text-[12px] font-bold text-[var(--text-dim)]"
                onClick={() => setNetOpen((v) => !v)}
                aria-expanded={netOpen}
                aria-haspopup="listbox"
              >
                {network.symbol}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {netOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[var(--line)] bg-[var(--sidebar-bg)] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.4)] light:bg-white light:shadow-[0_8px_24px_rgba(26,31,22,0.12)]" role="listbox">
                  {NETWORKS.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold', n.symbol === network.symbol && 'bg-[var(--hover)]')}
                      onClick={() => {
                        setNetwork(n.id)
                        setNetOpen(false)
                        setChartSymbol(n.symbol === 'USDT' ? 'ETH' : n.symbol)
                      }}
                    >
                      <CoinIcon symbol={n.symbol} />
                      {n.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-5 flex flex-nowrap gap-3.5">
            <div className="min-w-0">
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">Total Profit</div>
              <div className={cn('truncate text-[12.5px] font-bold', pnl24 >= 0 ? 'text-gain light:text-[#12985a]' : 'text-loss')}>
                {hideBalances ? '••••' : `${pnl24 >= 0 ? '+' : ''}${formatUsd(pnl24)}`}
              </div>
            </div>
            <div>
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">Avg. Growing</div>
              <div className={cn('truncate text-[12.5px] font-bold', avgGrow >= 0 ? 'text-gain light:text-[#12985a]' : 'text-loss')}>
                {hideBalances ? '••••' : `${avgGrow >= 0 ? '+' : ''}${avgGrow.toFixed(2)}%`}
              </div>
            </div>
            <div>
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">Best Performer</div>
              <div className="truncate text-[12.5px] font-bold">
                {best ? `${best.name} (${best.symbol})` : '—'}
              </div>
            </div>
          </div>

          <div className="mt-auto flex gap-2.5">
            <Link to="/app/receive" className={ui.limeBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
              Top Up
            </Link>
            <Link to="/app/send" className={ui.ghostBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v10" />
                <path d="M8 11l4 4 4-4" />
                <path d="M5 19h14" />
              </svg>
              Withdraw
            </Link>
          </div>
        </section>

        <section className="flex flex-col lg:[grid-area:crypto]">
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <div>
              <div className="text-[28px] font-extrabold tracking-tight max-[960px]:text-2xl">Live Crypto Updates</div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--text-dimmer)]">
                <span className="live-dot" />
                Last Update: {timeAgo(updatedAt)}
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2">
              <div className={ui.chip}>
                USD
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div className={ui.chip}>
                {network.name}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div className={ui.chip}>
                1D
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

          </div>

          <div className="grid flex-1 grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
            {liveCards.map((c) => {
              const pos = Number(c.change_24h) >= 0
              const spark = Array.isArray(c.sparkline) && c.sparkline.length
                ? c.sparkline
                : synthSpark(c.symbol, c.change_24h)
              return (
                <button
                  type="button"
                  key={c.symbol}
                  className={cn(ui.ccard, 'p-5')}
                  onClick={() => setChartSymbol((c.symbol || 'BTC').toUpperCase())}
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <CoinIcon symbol={c.symbol} />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-dimmer)]">{c.symbol}/USD</div>
                      <div className="text-[15px] font-bold">{c.name}</div>
                    </div>
                    <div className="ml-auto text-[var(--text-dimmer)]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </div>
                  </div>
                  <div className="mb-1.5 border-l-2 pl-1.5 text-xs text-[var(--text-dimmer)]" style={{ borderLeftColor: coinColor(c.symbol) }}>Price</div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="mb-1 text-[22px] font-extrabold tracking-tight">{formatUsd(c.price_usd)}</div>
                      <Change value={c.change_24h} />
                    </div>
                    <Sparkline points={spark} pos={pos} width={112} height={44} />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className={cn(ui.card, 'flex min-h-[460px] flex-col overflow-hidden p-0 lg:[grid-area:chart]')} ref={chartCardRef}>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <CoinIcon symbol={chartSymbol} />
              <div>
                <div className="flex items-center gap-1.5 text-[14px] font-extrabold">
                  {chartSymbol} / USD
                  <button
                    type="button"
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-dim)]"
                    onClick={() => {
                      const order = ['BTC', 'ETH', 'LTC', 'DOGE', 'USDT']
                      const i = order.indexOf(chartSymbol)
                      setChartSymbol(order[(i + 1) % order.length])
                    }}
                    aria-label="Next pair"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <div className="text-[11px] text-[var(--text-dimmer)]">Bitstamp</div>
              </div>
            </div>
            <div className="h-[22px] w-px bg-[var(--line)]" />
            <div className={cn(ui.tb, 'relative')}>
              <button type="button" data-interval-toggle onClick={() => setIntervalOpen((v) => !v)} className="flex items-center gap-1.5">
                {intervalLabel}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {intervalOpen && (
                <div data-interval-menu className="absolute left-0 top-full z-40 mt-1 min-w-[92px] rounded-xl border border-[var(--line)] bg-[var(--sidebar-bg)] p-1 light:bg-white">
                  {INTERVALS.map((i) => (
                    <button
                      key={i.value}
                      type="button"
                      className={cn('block w-full rounded-lg px-3 py-1.5 text-left text-[12px] font-semibold', i.value === interval && 'bg-[var(--hover)]')}
                      onClick={() => {
                        setIntervalId(i.value)
                        setIntervalOpen(false)
                      }}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={ui.tb}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h10M4 18h6" strokeLinecap="round" />
                <circle cx="17" cy="12" r="1.6" />
                <circle cx="13" cy="18" r="1.6" />
              </svg>
            </div>
            <button type="button" className={ui.tb}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="10" width="4" height="8" />
                <rect x="10" y="5" width="4" height="13" />
                <rect x="17" y="13" width="4" height="5" />
              </svg>
              Indicator
            </button>
            <button type="button" className={ui.tb}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 2" />
              </svg>
              Warning
            </button>
            <div className="flex-1" />
            <button type="button" className={ui.tb} aria-label="Snapshot">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
            </button>
            <button
              type="button"
              className={ui.tb}
              aria-label="Fullscreen"
              onClick={() => {
                const el = chartCardRef.current
                if (!el) return
                if (document.fullscreenElement) document.exitFullscreen()
                else el.requestFullscreen?.()
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="hidden w-11 flex-col items-center gap-0.5 border-r border-[var(--line)] py-2 md:flex">
              {[
                {
                  id: 'cross',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  ),
                },
                {
                  id: 'trend',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M4 20L20 4" />
                    </svg>
                  ),
                },
                {
                  id: 'hline',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M4 8h16M4 16h16" />
                    </svg>
                  ),
                },
                {
                  id: 'fib',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M4 6h16M4 12h10M4 18h6" />
                      <circle cx="17" cy="12" r="1.5" />
                      <circle cx="13" cy="18" r="1.5" />
                    </svg>
                  ),
                },
                {
                  id: 'brush',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17c3-6 6 6 9-6s6 6 9-6" />
                    </svg>
                  ),
                },
                {
                  id: 'text',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 7h14M12 7v11" />
                    </svg>
                  ),
                },
                {
                  id: 'emoji',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  id: 'measure',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M4 20L20 4" />
                      <path d="M9 9l2 2M13 5l2 2M7 13l2 2" />
                    </svg>
                  ),
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cn(ui.tool, tool === t.id && ui.toolOn)}
                  onClick={() => setTool(t.id)}
                  aria-label={t.id}
                >
                  {t.icon}
                </button>
              ))}
              <div className="my-1 h-px w-[18px] bg-[var(--line)]" />
              <button type="button" className={ui.tool} aria-label="Zoom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </button>
              <button type="button" className={ui.tool} aria-label="Magnet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7 13v-2a5 5 0 0 1 10 0v2" />
                  <path d="M5 13v4h4v-4M15 13v4h4v-4" />
                </svg>
              </button>
              <button type="button" className={ui.tool} aria-label="Lock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </button>
              <div className="my-1 h-px w-[18px] bg-[var(--line)]" />
              <button type="button" className={ui.tool} aria-label="Clear">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
                </svg>
              </button>
            </div>

            <div className="tv-embed min-h-[380px] min-w-0 flex-1">
              <TradingViewChart fill mode="advanced" symbol={chartSymbol} interval={interval} />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:[grid-area:portfolio]">
          <div className={ui.card}>
            <div className="mb-[18px] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={ui.cardIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 15l4-5 3 3 5-7" />
                  </svg>
                </div>
                <span className={ui.title}>My Portfolio</span>
              </div>
              <Link to="/app/activity" className={ui.expandBtn} aria-label="Open activity">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </Link>
            </div>

            <div className="mb-3.5 flex items-center gap-2">
              <div className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-bold', pnl30pct >= 0 ? 'bg-[var(--green-bg)] text-gain' : 'bg-red-500/15 text-loss')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={pnl30pct >= 0 ? 'M4 15l6-6 4 4 6-8' : 'M4 9l6 6 4-4 6 8'} />
                </svg>
                {Math.abs(pnl30pct).toFixed(2)}%
              </div>
              <div className="text-[12px] text-[var(--text-dimmer)]">Profit in last 24 hours</div>
            </div>

            {alloc.length > 0 && (
              <div className="alloc-wrap">
                <svg width="72" height="72" viewBox="0 0 36 36">
                  {(() => {
                    let off = 0
                    const sum = alloc.reduce((s, t) => s + t.usd, 0) || 1
                    return alloc.map((t, i) => {
                      const pct = (t.usd / sum) * 100
                      const dash = `${pct} ${100 - pct}`
                      const el = (
                        <circle
                          key={t.symbol}
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke={COLORS[i % COLORS.length]}
                          strokeWidth="4"
                          strokeDasharray={dash}
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

            <div className="holdings">
              {holdings.map((t) => (
                <button type="button" key={t.symbol} className={ui.wlItem} onClick={() => setPicked(t)}>
                  <CoinIcon symbol={t.symbol} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">
                      {t.name} ({t.symbol})
                    </div>
                    <div className="mt-px text-xs text-[var(--text-dimmer)]">
                      {hideBalances ? '••••' : formatUsd(t.usd)} · {hideBalances ? '••••' : t.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                  </div>
                  <Change value={t.change} />
                </button>
              ))}
            </div>

            {txs.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className={cn(ui.title, 'mb-2')}>Recent activity</div>
                {txs.slice(0, 4).map((tx) => {
                  const recv = (tx.transaction_type || '').toLowerCase() === 'received'
                  return (
                    <div key={tx.txid + tx.date} className={ui.wlItem}>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{recv ? 'Received' : 'Sent'}</div>
                        <div className="mt-px text-xs text-[var(--text-dimmer)]">{formatDate(tx.date)} · {shortAddress(tx.txid, 6, 4)}</div>
                      </div>
                      <div className={`wl-change ${recv ? 'pos' : 'neg'}`}>
                        {recv ? '+' : '−'}{formatBalance(tx.amount, 4)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={cn(ui.card, 'overflow-hidden')}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13.5px] font-bold">24h change</span>
              <span className="text-[11px] text-[var(--text-dimmer)]">{today}</span>
            </div>
            <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', pnl24 >= 0 ? 'bg-[var(--green-bg)] text-gain' : 'bg-red-500/15 text-loss')}>
              {pnl24 >= 0 ? 'Up' : 'Down'}
            </div>
            <div className={ui.amount}>{hideBalances ? '••••' : formatUsd(pnl24)}</div>
            <p className="mt-2 text-[12px] text-[var(--text-dimmer)]">
              Estimated from current holdings and 24h market moves. Not a realized P&amp;L.
            </p>
          </div>
        </aside>
      </div>
      <p className="mt-6 text-center text-[11px] text-[var(--text-dimmer)]">Piramid — live balances, alerts, and on-chain activity</p>
      </div>

      {picked && (
        <>
          <button type="button" className="fixed inset-0 z-[80] bg-black/55" onClick={() => setPicked(null)} aria-label="Close" />
          <aside className={cn(ui.card, 'fixed bottom-0 right-0 top-0 z-[90] w-[min(380px,100%)] overflow-auto rounded-none rounded-l-2xl')}>
            <div className="mb-[18px] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CoinIcon symbol={picked.symbol} />
                <div>
                  <div className="text-xs font-semibold">{picked.name}</div>
                  <div className="text-xs text-[var(--text-dimmer)]">{picked.symbol}</div>
                </div>
              </div>
              <button type="button" className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--muted-bg)]" onClick={() => setPicked(null)}>×</button>
            </div>
            <div className={cn(ui.amount, 'my-2 text-[28px]')}>
              {hideBalances ? '••••' : formatUsd(picked.usd)}
            </div>
            <div className="mb-4 text-xs text-[var(--text-dimmer)]">
              {hideBalances ? '••••' : `${formatBalance(picked.balance, 8)} ${picked.symbol}`} · {formatUsd(picked.price)}
            </div>
            <Change value={picked.change} />
            <div className="mt-[22px] flex gap-2.5">
              <Link to="/app/send" className={ui.limeBtn}>Send</Link>
              <Link to="/app/receive" className={ui.ghostBtn}>Receive</Link>
            </div>
            <button
              type="button"
              className={cn(ui.ghostBtn, 'mt-2.5 w-full')}
              onClick={() => {
                setChartSymbol(picked.symbol)
                setPicked(null)
              }}
            >
              View chart
            </button>
          </aside>
        </>
      )}
    </>
  )
}
