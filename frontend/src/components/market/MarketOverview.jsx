import { useEffect, useRef } from 'react'
import { useUiTheme } from '../../lib/theme'
import { mountTradingViewWidget } from '../../lib/tvWidget'

/** TradingView Market Overview — crypto tab */
export default function MarketOverview({ height = 420 }) {
  const containerRef = useRef(null)
  const { light, tvTheme, backgroundColor } = useUiTheme()

  useEffect(() => {
    return mountTradingViewWidget(
      containerRef.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js',
      {
        colorTheme: tvTheme,
        theme: tvTheme,
        dateRange: '12M',
        showChart: true,
        locale: 'en',
        width: '100%',
        height: '100%',
        largeChartUrl: '',
        isTransparent: false,
        showSymbolLogo: true,
        showFloatingTooltip: true,
        plotLineColorGrowing: light ? 'rgba(30, 35, 41, 0.75)' : 'rgba(215, 242, 76, 0.95)',
        plotLineColorFalling: light ? 'rgba(30, 35, 41, 0.35)' : 'rgba(255, 255, 255, 0.45)',
        gridLineColor: light ? 'rgba(30, 35, 41, 0.08)' : 'rgba(255, 255, 255, 0.06)',
        scaleFontColor: light ? 'rgba(30, 35, 41, 0.55)' : 'rgba(245, 245, 247, 0.7)',
        belowLineFillColorGrowing: light ? 'rgba(215, 242, 76, 0.18)' : 'rgba(215, 242, 76, 0.12)',
        belowLineFillColorFalling: light ? 'rgba(30, 35, 41, 0.04)' : 'rgba(255, 255, 255, 0.04)',
        symbolActiveColor: light ? 'rgba(215, 242, 76, 0.16)' : 'rgba(215, 242, 76, 0.12)',
        tabs: [
          {
            title: 'Crypto',
            symbols: [
              { s: 'BITSTAMP:BTCUSD', d: 'Bitcoin' },
              { s: 'BITSTAMP:ETHUSD', d: 'Ethereum' },
              { s: 'BINANCE:DOGEUSDT', d: 'Dogecoin' },
              { s: 'BITSTAMP:LTCUSD', d: 'Litecoin' },
              { s: 'BINANCE:SOLUSDT', d: 'Solana' },
              { s: 'BINANCE:XRPUSDT', d: 'XRP' },
              { s: 'BINANCE:BNBUSDT', d: 'BNB' },
              { s: 'CRYPTOCAP:USDT', d: 'Tether' },
            ],
          },
        ],
      }
    )
  }, [light, tvTheme])

  return (
    <div
      key={tvTheme}
      className="tradingview-widget-container h-full w-full overflow-hidden rounded-2xl"
      style={{ height, background: backgroundColor }}
      ref={containerRef}
    />
  )
}
