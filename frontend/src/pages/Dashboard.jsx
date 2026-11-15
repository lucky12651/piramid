import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { marketApi, walletApi } from '../services/api'
import { formatBalance, formatDate, coinMeta, shortAddress } from '../lib/utils'
import { WALLET_COINS } from '../lib/coins'
import { NETWORKS, useWalletStore } from '../store/useWalletStore'
import { readPriceCache, writePriceCache } from '../lib/priceCache'
import TradingViewChart from '../components/market/TradingViewChart'
import CoinIcon, { coinColor } from '../components/piramid/CoinIcon'
import Change from '../components/piramid/Change'
import Sparkline, { synthSpark } from '../components/piramid/Sparkline'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

const formatUsd = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value) || 0)

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
  const [walletStatus, setWalletStatus] = useState('loading')
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
      setWalletStatus('ready')
      setBalances(bRes.data || {})
      setTxs(Array.isArray(tRes.data) ? tRes.data.slice(0, 6) : [])
    } catch {
      setWalletStatus('error')
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


  return (
    <>
      <div className={cn(ui.page, "reference-dashboard")}>
      <h1 className="sr-only">Dashboard</h1>
      {walletStatus !== 'ready' && <div className="balance-status flex items-center justify-between gap-3" role="status">
        <span>{walletStatus === 'loading' ? 'Loading your wallet balances...' : 'Unable to refresh balances. Previously loaded values may be out of date.'}</span>
        {walletStatus === 'error' && <button type="button" className="flex items-center gap-2 font-semibold" onClick={() => { setWalletStatus('loading'); loadWallet() }}><RefreshCw size={16} /> Retry</button>}
      </div>}
      <div className="dashboard-grid">
        <section className={cn(ui.card, 'relative z-10 flex flex-col overflow-visible dashboard-balance')}>
          <div className="mb-[18px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn(ui.cardIcon, "reference-card-icon")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <span className={ui.title}>My Balance</span>
            </div>
            <button type="button" className={ui.expandBtn} onClick={toggleHideBalances} aria-label={hideBalances ? "Show balances" : "Hide balances"} aria-pressed={hideBalances}>
              {hideBalances ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="reference-balance-row mb-5 flex items-start justify-between gap-2">
            <div className={cn(ui.amount, 'reference-balance-value min-w-0 break-all')}>{walletStatus === 'ready' || Object.keys(balances).length ? mask(formatUsd(totalUsd)) : '\u2014'}</div>
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

          <div className="dashboard-stats mb-5">
            <div className="min-w-0">
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">Est. 24h P&L</div>
              <div className={cn('truncate text-[12.5px] font-bold', pnl24 >= 0 ? 'text-gain light:text-[#12985a]' : 'text-loss')}>
                {hideBalances ? '••••' : `${pnl24 >= 0 ? '+' : ''}${formatUsd(pnl24)}`}
              </div>
            </div>
            <div>
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">24h change</div>
              <div className={cn('truncate text-[12.5px] font-bold', avgGrow >= 0 ? 'text-gain light:text-[#12985a]' : 'text-loss')}>
                {hideBalances ? '••••' : `${avgGrow >= 0 ? '+' : ''}${avgGrow.toFixed(2)}%`}
              </div>
            </div>
            <div>
              <div className="mb-1 whitespace-nowrap text-[11px] text-[var(--text-dimmer)]">Top asset</div>
              <div className="truncate text-[12.5px] font-bold">
                {best ? best.symbol : '—'}
              </div>
            </div>
          </div>

          <div className="mt-auto flex gap-2.5">
            <Link to="/app/receive" className={ui.limeBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
              Deposit
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

        <section className="flex flex-col dashboard-market">
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <div>
              <div className="text-xl font-semibold tracking-tight">Live Crypto Updates</div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--text-dimmer)]">
                <span className="live-dot" />
                Last Update: {timeAgo(updatedAt)}
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2"><span className={ui.chip}>USD</span><span className={ui.chip}>1D</span><Link to="/app/market" className="reference-see-all">See All <span aria-hidden="true">&rsaquo;</span></Link></div>

          </div>

          <div className="dashboard-market-cards">
            {liveCards.map((c) => {
              const pos = Number(c.change_24h) >= 0
              const spark = Array.isArray(c.sparkline) && c.sparkline.length
                ? c.sparkline
                : synthSpark(c.symbol, c.change_24h)
              return (
                <button
                  type="button"
                  key={c.symbol}
                  aria-pressed={chartSymbol === c.symbol.toUpperCase()}
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
                      <div className="reference-asset-price mb-1 font-extrabold tracking-tight">{formatUsd(c.price_usd)}</div>
                      <Change value={c.change_24h} />
                    </div>
                    <Sparkline points={spark} pos={pos} width={76} height={32} />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className={cn(ui.card, 'flex min-h-[460px] flex-col overflow-hidden p-0 dashboard-chart')} ref={chartCardRef}>
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
            <Link to="/app/alerts" className={ui.tb}>Price alerts</Link>
            <div className="flex-1" />
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
            <div className="dashboard-chart-embed min-w-0 flex-1">
              <TradingViewChart fill mode="advanced" symbol={chartSymbol} interval={interval} />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 dashboard-portfolio">
          <div className={ui.card}>
            <div className="mb-[18px] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(ui.cardIcon, "reference-card-icon")}>
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
              <div className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-bold', avgGrow >= 0 ? 'bg-[var(--green-bg)] text-gain' : 'bg-red-500/15 text-loss')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={avgGrow >= 0 ? 'M4 15l6-6 4 4 6-8' : 'M4 9l6 6 4-4 6 8'} />
                </svg>
                {Math.abs(avgGrow).toFixed(2)}%
              </div>
              <div className="text-[12px] text-[var(--text-dimmer)]">24h portfolio change</div>
            </div>

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

          <div className={cn(ui.card, 'reference-performance overflow-hidden')}>
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
