import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Activity, ArrowUpRight, ArrowUpDown, BarChart3, Bell, ChevronRight, RefreshCw, Search, Star, TrendingUp } from 'lucide-react'
import { marketApi } from '../services/api'
import { writePriceCache } from '../lib/priceCache'
import { TV_SYMBOLS } from '../lib/coins'
import CoinIcon from '../components/piramid/CoinIcon'
import Change from '../components/piramid/Change'
import TradingViewChart from '../components/market/TradingViewChart'
import { useWalletStore } from '../store/useWalletStore'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

const money = (value, compact = false) => value == null || !Number.isFinite(Number(value)) ? '\u2014' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 2 : Number(value) > 0 && Number(value) < 1 ? 8 : 2 }).format(Number(value))
const filters = [['all', 'All assets'], ['watchlist', 'Watchlist'], ['gainers', 'Gainers'], ['losers', 'Losers']]
const intervals = [['60', '1H'], ['240', '4H'], ['D', '1D']]
const change = (coin) => coin.change_24h == null ? null : Number(coin.change_24h)

export default function Market() {
  const { searchQuery = '' } = useOutletContext() || {}
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'market_cap', descending: true })
  const [selected, setSelected] = useState('BTC')
  const [interval, setIntervalId] = useState('60')
  const chartRef = useRef(null)
  const active = useRef(false)
  const pending = useRef(false)
  const favorites = useWalletStore((s) => s.favoriteTokens)
  const toggleFavorite = useWalletStore((s) => s.toggleFavorite)

  const load = useCallback(async () => {
    if (pending.current) return
    pending.current = true
    setLoading(true)
    try {
      const { data } = await marketApi.prices()
      if (!Array.isArray(data) || !data.length) throw new Error('No market data')
      if (active.current) {
        setPrices(data)
        writePriceCache(data)
        setUpdatedAt(new Date())
        setError(false)
      }
    } catch {
      if (active.current) setError(true)
    } finally {
      pending.current = false
      if (active.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    active.current = true
    load()
    const timer = setInterval(load, 60_000)
    return () => { active.current = false; clearInterval(timer) }
  }, [load])

  const summary = useMemo(() => {
    const changes = prices.map(change).filter((v) => v != null && Number.isFinite(v))
    return {
      cap: prices.reduce((sum, coin) => sum + Number(coin.market_cap || 0), 0),
      volume: prices.reduce((sum, coin) => sum + Number(coin.volume_24h || 0), 0),
      rising: changes.filter((v) => v > 0).length,
      falling: changes.filter((v) => v < 0).length,
      total: changes.length,
    }
  }, [prices])
  const movers = useMemo(() => [...prices].filter((coin) => change(coin) != null && Number.isFinite(change(coin))).sort((a, b) => Math.abs(change(b)) - Math.abs(change(a))).slice(0, 4), [prices])
  const visible = useMemo(() => {
    const terms = [query, searchQuery].map((v) => v.trim().toLowerCase()).filter(Boolean)
    return prices.filter((coin) => {
      if (!terms.every((term) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(term))) return false
      if (filter === 'watchlist') return favorites.includes(coin.symbol)
      if (filter === 'gainers') return change(coin) > 0
      if (filter === 'losers') return change(coin) < 0
      return true
    }).sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av == null) return bv == null ? 0 : 1
      if (bv == null) return -1
      const result = sort.key === 'name' ? String(av).localeCompare(String(bv)) : Number(av) - Number(bv)
      return sort.descending ? -result : result
    })
  }, [prices, query, searchQuery, filter, favorites, sort])
  const selectedCoin = prices.find((coin) => coin.symbol === selected)
  const selectCoin = (symbol) => {
    setSelected(symbol)
    chartRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
  const chartSymbol = selected === 'USDT' ? 'KRAKEN:USDTUSD' : TV_SYMBOLS[selected] || `BINANCE:${selected}USDT`
  const sortBy = (key) => setSort((previous) => ({ key, descending: previous.key === key ? !previous.descending : key !== 'name' }))
  const sortHeading = (key, label, extra = '') => <th scope="col" className={extra} aria-sort={sort.key === key ? sort.descending ? 'descending' : 'ascending' : 'none'}><button type="button" onClick={() => sortBy(key)}>{label}<ArrowUpDown size={12} /></button></th>

  return <div className={cn(ui.page, 'market-page')}>
    <header className="market-heading">
      <div><div className="market-eyebrow">Discover your next move</div><h1>Markets<span className="market-heading-dot" /></h1><p>Follow the market. Build your watchlist. Stay a step ahead.</p></div>
      <div className="market-header-actions"><Link to="/app/alerts" className="market-secondary"><Bell size={15} />Price alerts</Link><button type="button" className="market-secondary market-refresh" onClick={load} disabled={loading} aria-label="Refresh market prices"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button></div>
    </header>
    {error && <div className="market-notice" role="status">{prices.length ? 'Prices could not be refreshed. Showing the last loaded values.' : 'Market prices are unavailable. Please try again.'}<button type="button" onClick={load} disabled={loading}>Retry</button></div>}

    <div className="market-summaries">
      <section className="market-summary"><div className="market-summary-label"><span>Tracked market cap</span><span className="market-small-icon"><BarChart3 size={16} /></span></div><strong>{prices.length && summary.cap ? money(summary.cap, true) : '\u2014'}</strong><p>Across {prices.length || '\u2014'} listed assets</p></section>
      <section className="market-summary"><div className="market-summary-label"><span>24h trading volume</span><span className="market-small-icon"><Activity size={16} /></span></div><strong>{prices.length && summary.volume ? money(summary.volume, true) : '\u2014'}</strong><p>Combined volume of listed assets</p></section>
      <section className="market-summary market-breadth"><div className="market-summary-label"><span>24h market breadth</span><span className="market-small-icon"><TrendingUp size={16} /></span></div><div className="market-breadth-values"><strong>{summary.total ? summary.rising : '\u2014'}<span> rising</span></strong><span>{summary.total ? summary.falling : '\u2014'} falling</span></div><div className="market-breadth-bar" aria-hidden="true"><span style={{ width: `${summary.total ? summary.rising / summary.total * 100 : 0}%` }} /></div><p>Direction of listed assets; unchanged assets excluded from counts</p></section>
    </div>

    <div className="market-insights">
      <section className="market-chart-card" ref={chartRef} aria-label="Asset price chart">
        <header className="market-chart-header"><div className="market-chart-asset"><CoinIcon symbol={selected} /><div><h2>{selectedCoin?.name || selected}<span>{selected} / USD</span></h2><div className="market-chart-quote"><strong>{money(selectedCoin?.price_usd)}</strong>{selectedCoin?.change_24h != null && <Change value={selectedCoin.change_24h} />}</div></div></div><div className="market-intervals" role="group" aria-label="Chart interval">{intervals.map(([value, label]) => <button key={value} type="button" aria-pressed={interval === value} onClick={() => setIntervalId(value)}>{label}</button>)}</div></header>
        <div className="market-chart-embed"><TradingViewChart fill mode="advanced" symbol={chartSymbol} interval={interval} /></div>
        <footer className="market-chart-footer"><span>Chart powered by TradingView</span><span>Quotes may differ between sources</span></footer>
      </section>
      <aside className="market-movers"><header><span className="market-small-icon"><TrendingUp size={17} /></span><div><h2>Top movers</h2><p>Largest absolute moves in 24h</p></div><span className="market-period">24h</span></header><div className="market-mover-list">
        {movers.map((coin, index) => <button type="button" className="market-mover" key={coin.symbol} onClick={() => selectCoin(coin.symbol)} aria-label={`View ${coin.name} chart`}><span className="market-mover-rank">0{index + 1}</span><CoinIcon symbol={coin.symbol} /><span className="market-mover-name"><b>{coin.name}</b><small>{money(coin.price_usd)}</small></span><Change value={coin.change_24h} /></button>)}
        {!movers.length && <p className="market-movers-empty">{loading ? 'Loading market movers...' : 'Movers will appear when prices are available.'}</p>}
      </div><div className="market-watchlist-tip"><Star size={17} /><div><b>Keep your favorites close</b><p>Star any asset below to add it to your personal watchlist.</p></div></div></aside>
    </div>

    <section className="market-assets" aria-labelledby="market-assets-title">
      <div className="market-assets-heading"><div><h2 id="market-assets-title">Explore assets <span>{prices.length}</span></h2><p>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Refreshes every minute` : 'Prices and changes in USD'}</p></div><label className="market-search"><Search size={16} /><input aria-label="Search market assets" placeholder="Search name or symbol" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
      <div className="market-filter-row"><div className="market-filters" role="group" aria-label="Filter market assets">{filters.map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === 'watchlist' && <Star size={13} />}{label}{id === 'watchlist' && <span>{favorites.length}</span>}</button>)}</div><span className="market-currency">USD</span></div>
      <div className="market-table-scroll"><table className="market-table"><thead><tr><th scope="col"><span className="sr-only">Watchlist</span></th>{sortHeading('name', 'Asset')}{sortHeading('price_usd', 'Price', 'num')}{sortHeading('change_24h', '24h change', 'num')}{sortHeading('market_cap', 'Market cap', 'num market-extra-column')}{sortHeading('volume_24h', '24h volume', 'num market-extra-column')}<th scope="col" className="market-chart-column"><span className="sr-only">View chart</span></th></tr></thead><tbody>
        {visible.map((coin) => <tr key={coin.symbol} className={coin.symbol === selected ? 'market-selected-row' : ''}><td><button type="button" className="market-star" aria-label={`${favorites.includes(coin.symbol) ? 'Remove' : 'Add'} ${coin.name} ${favorites.includes(coin.symbol) ? 'from' : 'to'} watchlist`} aria-pressed={favorites.includes(coin.symbol)} onClick={() => toggleFavorite(coin.symbol)}><Star size={16} fill={favorites.includes(coin.symbol) ? 'currentColor' : 'none'} /></button></td><td><button type="button" className="market-asset-name" onClick={() => selectCoin(coin.symbol)} aria-label={`Open ${coin.name} price chart`}><CoinIcon symbol={coin.symbol} /><span><b>{coin.name}</b><small>{coin.symbol}</small></span></button></td><td className="num market-price">{money(coin.price_usd)}</td><td className="num">{coin.change_24h == null ? '\u2014' : <Change value={coin.change_24h} className="justify-end" />}</td><td className="num market-extra-column">{money(coin.market_cap, true)}</td><td className="num market-extra-column">{money(coin.volume_24h, true)}</td><td className="market-chart-column"><button type="button" className="market-chart-button" aria-label={`Chart ${coin.symbol}`} onClick={() => selectCoin(coin.symbol)}><ArrowUpRight size={16} /></button></td></tr>)}
      </tbody></table></div>
      {!visible.length && <div className="market-empty" role="status"><Search size={25} /><h3>{loading && !prices.length ? 'Loading market prices...' : error && !prices.length ? 'Prices are temporarily unavailable' : filter === 'watchlist' && !favorites.length ? 'Your watchlist starts here' : 'No assets found'}</h3><p>{loading && !prices.length ? 'Fetching the latest available quotes.' : filter === 'watchlist' && !favorites.length ? 'Choose All assets and star the coins you want to follow.' : 'Try another search or filter.'}</p>{(query || filter !== 'all') && <button type="button" onClick={() => { setQuery(''); setFilter('all') }}>Reset filters <ChevronRight size={14} /></button>}</div>}
      <footer className="market-table-footer"><span>{visible.length} of {prices.length} assets</span><span>Market data by CoinGecko</span></footer>
    </section>
    <p className="market-disclaimer">Market summaries cover the listed assets only. Prices and charts may update at different times.</p>
  </div>
}
