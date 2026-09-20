import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { WALLET_COINS } from '../lib/coins'
import { useWalletStore } from '../store/useWalletStore'
import { formatUsd } from '../lib/utils'
import CoinIcon from '../components/piramid/CoinIcon'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'
import { useOutletContext } from 'react-router-dom'
import BinancePage, { Faq } from '../components/layout/BinancePage'

export default function Alerts() {
  const alerts = useWalletStore((s) => s.alerts)
  const addAlert = useWalletStore((s) => s.addAlert)
  const removeAlert = useWalletStore((s) => s.removeAlert)
  const { prices = [] } = useOutletContext() || {}
  const [symbol, setSymbol] = useState('BTC')
  const [dir, setDir] = useState('above')
  const [target, setTarget] = useState('')

  const priceMap = useMemo(() => {
    const m = {}
    for (const p of prices) m[(p.symbol || '').toUpperCase()] = p
    return m
  }, [prices])

  const onAdd = (e) => {
    e.preventDefault()
    const n = Number(target)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a target price')
      return
    }
    addAlert({ symbol, dir, target: n })
    toast.success('Alert created')
    setTarget('')
  }

  return (
    <BinancePage
      crumb="Alerts"
      title="Price Alerts"
      sub="Get a notification when a coin crosses your target."
      aside={
        <Faq
          items={[
            { q: 'How often are prices checked?', a: 'About once a minute against the live market feed.' },
            { q: 'Do alerts persist?', a: 'Yes, they are saved on this device until you delete them.' },
          ]}
        />
      }
    >
      <form className={ui.panel} style={{ marginBottom: 16 }} onSubmit={onAdd}>
        <div className={ui.row}>
          <div className={ui.label}>Coin</div>
          <select className={ui.input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {WALLET_COINS.map((c) => (
              <option key={c} value={c}>
                {c} {priceMap[c] ? `· ${formatUsd(priceMap[c].price_usd)}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Condition</div>
          <select className={ui.input} value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
          </select>
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Target (USD)</div>
          <input className={ui.input} type="number" step="any" min="0" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <button type="submit" className={ui.submit}>Create alert</button>
      </form>

      <div className={ui.tableWrap}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th>Coin</th>
              <th>Condition</th>
              <th>Last</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--text-dimmer)' }}>No alerts</td>
              </tr>
            )}
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <CoinIcon symbol={a.symbol} /> {a.symbol}
                  </span>
                </td>
                <td>
                  {a.dir} {formatUsd(a.target)}
                </td>
                <td>{priceMap[a.symbol] ? formatUsd(priceMap[a.symbol].price_usd) : '—'}</td>
                <td>{a.triggered ? 'Triggered' : 'Watching'}</td>
                <td>
                  <button type="button" className={ui.link} style={{ color: 'var(--red)' }} onClick={() => removeAlert(a.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BinancePage>
  )
}
