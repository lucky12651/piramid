import { useEffect, useRef } from 'react'
import BinancePage from '../components/layout/BinancePage'
import { useUiTheme } from '../lib/theme'
import { mountTradingViewWidget } from '../lib/tvWidget'
import { ui } from '../components/piramid/ui'

export default function Calendar() {
  const ref = useRef(null)
  const { tvTheme, backgroundColor } = useUiTheme()

  useEffect(() => {
    return mountTradingViewWidget(
      ref.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-events.js',
      {
        colorTheme: tvTheme,
        theme: tvTheme,
        isTransparent: false,
        locale: 'en',
        importanceFilter: '-1,0,1',
        currencyFilter: 'USD,EUR,GBP,JPY,CNY',
        width: '100%',
        height: '100%',
      }
    )
  }, [tvTheme])

  return (
    <BinancePage crumb="Calendar" title="Economic Calendar" sub="Macro events that move markets." wide>
      <div className={ui.panel} style={{ padding: 8, minHeight: 640, background: backgroundColor }}>
        <div
          key={tvTheme}
          className="tradingview-widget-container overflow-hidden rounded-xl"
          style={{ height: 620, width: '100%', background: backgroundColor }}
          ref={ref}
        />
      </div>
    </BinancePage>
  )
}
