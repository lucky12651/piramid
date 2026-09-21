import { useEffect, useRef } from 'react'
import BinancePage from '../components/layout/BinancePage'
import { useUiTheme } from '../lib/theme'
import { mountTradingViewWidget } from '../lib/tvWidget'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

const CALENDAR_HEIGHT = 760

export default function Calendar() {
  const ref = useRef(null)
  const { tvTheme, backgroundColor } = useUiTheme()

  useEffect(() => {
    return mountTradingViewWidget(
      ref.current,
      'https://s3.tradingview.com/external-embedding/embed-widget-events.js',
      {
        colorTheme: tvTheme,
        locale: 'en',
        importanceFilter: '-1,0,1',
        currencyFilter: 'USD,EUR,GBP,JPY,CNY',
        width: '100%',
        height: CALENDAR_HEIGHT,
        isTransparent: false,
      }
    )
  }, [tvTheme])

  return (
    <BinancePage crumb="Calendar" title="Economic Calendar" sub="Macro events that move markets." wide>
      <div
        className={cn(ui.card, 'flex flex-col overflow-hidden p-0')}
        style={{ height: CALENDAR_HEIGHT, background: backgroundColor }}
      >
        <div
          key={tvTheme}
          className="tv-embed tv-calendar tradingview-widget-container min-h-0 w-full flex-1"
          style={{ height: CALENDAR_HEIGHT, background: backgroundColor }}
          ref={ref}
        />
      </div>
    </BinancePage>
  )
}
