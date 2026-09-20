import { useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { WALLET_COINS } from '../lib/coins'
import { marketApi, walletApi } from '../services/api'
import { formatUsd } from '../lib/utils'
import { ui } from '../components/piramid/ui'
import BinancePage, { Faq, TransferTabs } from '../components/layout/BinancePage'

export default function Swap() {
  const [from, setFrom] = useState('ETH')
  const [to, setTo] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [prices, setPrices] = useState([])
  const [bal, setBal] = useState(0)
  const slippage = 0.5

  useEffect(() => {
    marketApi.prices().then((r) => setPrices(r.data || [])).catch(() => {})
  }, [])
  useEffect(() => {
    walletApi.balance(from).then((r) => setBal(r.data?.balance || 0)).catch(() => setBal(0))
  }, [from])

  const map = useMemo(() => {
    const m = {}
    for (const p of prices) m[(p.symbol || '').toUpperCase()] = Number(p.price_usd || 0)
    return m
  }, [prices])

  const fromPx = map[from] || 0
  const toPx = map[to] || 0
  const pay = Number(amount || 0)
  const rawOut = fromPx && toPx ? (pay * fromPx) / toPx : 0
  const out = rawOut * (1 - slippage / 100)
  const rate = fromPx && toPx ? fromPx / toPx : 0

  const onSwap = (e) => {
    e.preventDefault()
    if (!pay || !out) {
      toast.error('Enter an amount')
      return
    }
    toast(`Quote: ${pay} ${from} ≈ ${out.toFixed(6)} ${to}. On-chain DEX routing is not enabled yet.`, {
      icon: '⇄',
      duration: 5000,
    })
  }

  return (
    <BinancePage
      crumb="Trade"
      title="Trade"
      sub="Convert between assets with a live USD quote."
      tabs={<TransferTabs />}
      aside={
        <Faq
          items={[
            { q: 'Is this an on-chain swap?', a: 'This screen shows a live market quote. Broadcasting a DEX swap is not enabled yet — use Withdraw for on-chain sends.' },
            { q: 'Where does the rate come from?', a: 'CoinGecko USD prices, with 0.5% illustrative slippage.' },
            { q: 'Can I convert any pair?', a: 'Any two of BTC, LTC, ETH, DOGE, and USDT in this wallet.' },
          ]}
        />
      }
    >
      <form className={ui.panel} onSubmit={onSwap}>
        <div className={ui.row}>
          <div className={ui.label}>
            From
            <button type="button" className={ui.link} onClick={() => setAmount(String(bal || 0))}>
              Max {bal} {from}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={ui.input} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            <select className={ui.input} style={{ maxWidth: 120, fontWeight: 700 }} value={from} onChange={(e) => setFrom(e.target.value)}>
              {WALLET_COINS.filter((c) => c !== to).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className={ui.hint} style={{ marginTop: 6 }}>{pay && fromPx ? formatUsd(pay * fromPx) : '—'}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
          <button
            type="button"
            className="expand-btn"
            onClick={() => {
              setFrom(to)
              setTo(from)
            }}
            aria-label="Flip"
          >
            <ArrowDown size={16} />
          </button>
        </div>

        <div className={ui.row}>
          <div className={ui.label}>To</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={ui.input} readOnly value={out ? out.toFixed(6) : ''} placeholder="0.00" />
            <select className={ui.input} style={{ maxWidth: 120, fontWeight: 700 }} value={to} onChange={(e) => setTo(e.target.value)}>
              {WALLET_COINS.filter((c) => c !== from).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className={ui.hint} style={{ marginTop: 6 }}>{out && toPx ? formatUsd(out * toPx) : '—'}</div>
        </div>

        <div className={ui.warn}>
          Rate 1 {from} = {rate ? rate.toFixed(6) : '—'} {to} · Slippage {slippage}%
        </div>

        <button type="submit" className={ui.submit}>Preview convert</button>
      </form>
    </BinancePage>
  )
}
