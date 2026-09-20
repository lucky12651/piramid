import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUiTheme } from '../../lib/theme'
import { mountTradingViewWidget } from '../../lib/tvWidget'

/** Auto-refresh interval for latest headlines (ms) */
const REFRESH_MS = 90_000 // 90 seconds

/**
 * TradingView Timeline (news) — reloads periodically so the feed stays fresh.
 */
export default function TradingViewNews({
  height = 420,
  fill = false,
  refreshInterval = REFRESH_MS,
  showRefresh = true,
}) {
  const containerRef = useRef(null)
  const { tvTheme } = useUiTheme()
  const [tick, setTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const mountWidget = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const stop = mountTradingViewWidget(
      el,
      `https://s3.tradingview.com/external-embedding/embed-widget-timeline.js?v=${Date.now()}`,
      {
        feedMode: 'market',
        market: 'crypto',
        isTransparent: false,
        displayMode: 'regular',
        width: '100%',
        height: '100%',
        colorTheme: tvTheme,
        theme: tvTheme,
        locale: 'en',
      }
    )
    setLastUpdated(new Date())
    return stop
  }, [tvTheme])

  useEffect(() => {
    const stop = mountWidget()
    return () => {
      if (typeof stop === 'function') stop()
    }
  }, [tick, mountWidget])

  // Auto-refresh on interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 15_000) return undefined
    const id = setInterval(() => {
      setTick((t) => t + 1)
    }, refreshInterval)
    return () => clearInterval(id)
  }, [refreshInterval])

  // Refresh when tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setTick((t) => t + 1)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const manualRefresh = () => {
    setRefreshing(true)
    setTick((t) => t + 1)
    setTimeout(() => setRefreshing(false), 800)
  }

  const timeLabel = lastUpdated.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {showRefresh && (
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2 px-1">
          <p className="text-[10px] text-emerald-200/40">
            Live crypto feed · updated {timeLabel}
          </p>
          <button
            type="button"
            onClick={manualRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200/70 transition hover:border-emerald-400/40 hover:text-emerald-100"
            title="Refresh news"
          >
            <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      )}
      <div
        className="tradingview-widget-container min-h-0 w-full flex-1 overflow-hidden rounded-xl"
        style={
          fill
            ? { height: '100%', width: '100%', minHeight: 0 }
            : { height, width: '100%' }
        }
        ref={containerRef}
      />
    </div>
  )
}
