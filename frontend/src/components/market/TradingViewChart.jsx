import { useEffect, useRef } from 'react'
import { TV_OVERVIEW_SYMBOLS, TV_SYMBOLS } from '../../lib/coins'
import { useUiTheme } from '../../lib/theme'
import { mountTradingViewWidget } from '../../lib/tvWidget'

/**
 * TradingView chart.
 * mode="advanced" — candlestick (Piramid dashboard)
 * default — symbol overview widget
 */
export default function TradingViewChart({
  height = 520,
  fill = false,
  mode = 'overview',
  symbol = 'BTC',
  interval = '60',
}) {
  const containerRef = useRef(null)
  const tvSymbol = TV_SYMBOLS[symbol] || symbol || 'BITSTAMP:BTCUSD'
  const { light, tvTheme, backgroundColor, gridColor, fontColor } = useUiTheme()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const src =
      mode === 'advanced'
        ? 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        : 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    const config =
      mode === 'advanced'
        ? {
            autosize: true,
            symbol: tvSymbol,
            interval,
            timezone: 'Etc/UTC',
            theme: tvTheme,
            colorTheme: tvTheme,
            style: '1',
            locale: 'en',
            backgroundColor,
            gridColor,
            hide_top_toolbar: true,
            hide_legend: false,
            allow_symbol_change: false,
            calendar: false,
            hide_volume: false,
            support_host: 'https://www.tradingview.com',
          }
        : {
            symbols: TV_OVERVIEW_SYMBOLS,
            chartOnly: false,
            width: '100%',
            height: '100%',
            locale: 'en',
            colorTheme: tvTheme,
            theme: tvTheme,
            autosize: true,
            showVolume: false,
            showMA: false,
            hideDateRanges: false,
            hideMarketStatus: false,
            hideSymbolLogo: false,
            scalePosition: 'right',
            scaleMode: 'Normal',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12',
            noTimeScale: false,
            valuesTracking: '1',
            changeMode: 'price-and-percent',
            chartType: 'area',
            maLineColor: '#b8d12a',
            maLineWidth: 1,
            maLength: 9,
            fontColor,
            gridLineColor: gridColor,
            backgroundColor,
            widgetFontColor: fontColor,
            lineWidth: 2,
            lineType: 0,
            dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
          }
    return mountTradingViewWidget(el, src, config)
  }, [mode, tvSymbol, interval, tvTheme, backgroundColor, gridColor, fontColor, light])

  return (
    <div
      className="tradingview-widget-container h-full w-full overflow-hidden"
      style={
        fill
          ? { height: '100%', width: '100%', minHeight: 0, background: backgroundColor }
          : { height, width: '100%', background: backgroundColor }
      }
      ref={containerRef}
    />
  )
}
