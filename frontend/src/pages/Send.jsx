import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { marketApi, walletApi } from '../services/api'
import { explorerUrl, formatBalance, formatUsd } from '../lib/utils'
import { DEFAULT_FEES, WALLET_COINS } from '../lib/coins'
import { useWalletStore } from '../store/useWalletStore'
import CoinIcon from '../components/piramid/CoinIcon'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'
import BinancePage, { Faq, TransferTabs } from '../components/layout/BinancePage'

export default function Send() {
  const [coin, setCoin] = useState('BTC')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState(String(DEFAULT_FEES.BTC))
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [price, setPrice] = useState(0)
  const contacts = useWalletStore((s) => s.contacts)
  const addContact = useWalletStore((s) => s.addContact)

  const needsFee = coin === 'BTC' || coin === 'LTC' || coin === 'DOGE'
  const matched = useMemo(
    () => contacts.filter((c) => c.coin === coin || !c.coin),
    [contacts, coin]
  )
  const usd = Number(amount || 0) * Number(price || 0)

  useEffect(() => {
    const d = DEFAULT_FEES[coin]
    setFee(d != null ? String(d) : '')
    setResult(null)
    walletApi.balance(coin).then((r) => setBalance(r.data?.balance || 0)).catch(() => setBalance(0))
    marketApi
      .prices()
      .then((r) => {
        const row = (r.data || []).find((p) => (p.symbol || '').toUpperCase() === coin)
        setPrice(Number(row?.price_usd || 0))
      })
      .catch(() => setPrice(0))
  }, [coin])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const payload = { coin, address: address.trim(), amount: Number(amount) }
      if (needsFee && fee) payload.fee = Number(fee)
      const { data } = await walletApi.send(payload)
      setResult(data)
      toast.success(data.message || 'Transaction broadcasted')
      if (address.trim() && !contacts.some((c) => c.address === address.trim())) {
        addContact({ name: `${address.slice(0, 6)}…${address.slice(-4)}`, address: address.trim(), coin })
      }
      setAmount('')
      setAddress('')
      const bal = await walletApi.balance(coin)
      setBalance(bal.data?.balance || 0)
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Send failed')
    } finally {
      setLoading(false)
    }
  }

  const placeholders = {
    BTC: 'bc1… or 1…',
    LTC: 'L… or M…',
    DOGE: 'D…',
    ETH: '0x…',
    USDT: '0x… (ERC-20)',
  }

  return (
    <BinancePage
      crumb="Withdraw"
      title="Withdraw"
      sub="Send crypto on-chain from your self-custody wallet."
      tabs={<TransferTabs />}
      aside={
        <>
          <div className={ui.side}>
            <h3>Tips</h3>
            <div className={ui.warn}>
              Double-check the network and address. Wrong-chain deposits usually cannot be recovered.
              {coin === 'USDT' ? ' USDT is ERC-20 on Ethereum only.' : ''}
            </div>
          </div>
          <Faq
            items={[
              { q: 'How long does a withdrawal take?', a: 'After broadcast, confirmation time depends on the network (BTC ~10m+, ETH usually faster).' },
              { q: 'Can I cancel a withdrawal?', a: 'No. Once it is signed and broadcast, it is irreversible.' },
              { q: 'What fee is charged?', a: 'The network miner/validator fee you set (or ETH gas). Piramid does not take an extra platform fee.' },
            ]}
          />
        </>
      }
    >
      <form className={ui.panel} onSubmit={onSubmit}>
        <div className={ui.row}>
          <div className={ui.label}>Coin</div>
          <div className="flex flex-wrap gap-2">
            {WALLET_COINS.map((c) => (
              <button key={c} type="button" className={cn(ui.coin, coin === c && ui.coinOn)} onClick={() => setCoin(c)}>
                <CoinIcon symbol={c} />
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={ui.row}>
          <div className={ui.label}>
            Address
            {matched.length > 0 && <span className={ui.hint}>Address book</span>}
          </div>
          {matched.length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
              {matched.slice(0, 6).map((c) => (
                <button key={c.id} type="button" className={ui.coin} onClick={() => setAddress(c.address)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <input
            className={ui.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder={placeholders[coin]}
          />
        </div>

        <div className={ui.row}>
          <div className={ui.label}>
            Amount
            <span className={ui.hint}>
              Available {formatBalance(balance)} {coin}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={ui.input}
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
            />
            <button
              type="button"
              className={cn(ui.coin, ui.coinOn)}
              onClick={() => setAmount(String(Math.max(balance - (needsFee ? Number(fee || 0) : 0), 0)))}
            >
              Max
            </button>
          </div>
          <div className={ui.hint} style={{ marginTop: 6 }}>≈ {formatUsd(usd)}</div>
        </div>

        {needsFee && (
          <div className={ui.row}>
            <div className={ui.label}>Network fee ({coin})</div>
            <input className={ui.input} type="number" step="any" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
        )}

        <button type="submit" disabled={loading} className={ui.submit}>
          {loading ? 'Broadcasting…' : `Withdraw ${coin}`}
        </button>

        {result?.success && (
          <div className={ui.warn} style={{ marginTop: 16 }}>
            Broadcast successful.{' '}
            <a href={explorerUrl(result.coin, result.txid)} target="_blank" rel="noreferrer" className={ui.link}>
              View on explorer
            </a>
            <div className={ui.addr} style={{ marginTop: 8 }}>{result.txid}</div>
          </div>
        )}
      </form>
    </BinancePage>
  )
}
