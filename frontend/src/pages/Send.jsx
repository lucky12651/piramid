import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { marketApi, walletApi } from '../services/api'
import { explorerUrl, formatBalance, formatUsd } from '../lib/utils'
import { getApiError } from '../lib/errors'
import { validateAddress } from '../lib/address'
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
  const [ethBalance, setEthBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [price, setPrice] = useState(0)
  const [gas, setGas] = useState(null)
  const [step, setStep] = useState('form')
  const contacts = useWalletStore((s) => s.contacts)
  const addContact = useWalletStore((s) => s.addContact)

  const needsFee = coin === 'BTC' || coin === 'LTC' || coin === 'DOGE'
  const matched = useMemo(
    () => contacts.filter((c) => c.coin === coin || !c.coin),
    [contacts, coin]
  )
  const pay = Number(amount || 0)
  const feeNum = needsFee ? Number(fee || 0) : Number(gas?.transfer_eth || 0)
  const total = pay + (coin === 'USDT' ? 0 : feeNum)
  const usd = pay * Number(price || 0)
  const addrCheck = validateAddress(coin, address)
  const insufficient =
    coin === 'USDT'
      ? pay > balance || (gas && ethBalance < Number(gas.transfer_eth || 0) * 4)
      : total > balance + 1e-12

  useEffect(() => {
    const d = DEFAULT_FEES[coin]
    setFee(d != null ? String(d) : '')
    setResult(null)
    setStep('form')
    walletApi.balance(coin).then((r) => setBalance(r.data?.balance || 0)).catch(() => setBalance(0))
    if (coin === 'USDT' || coin === 'ETH') {
      walletApi.balance('ETH').then((r) => setEthBalance(r.data?.balance || 0)).catch(() => setEthBalance(0))
      walletApi.gas().then((r) => setGas(r.data)).catch(() => setGas(null))
      walletApi.estimateFee(coin).then((r) => {
        if (r.data?.fee != null && coin === 'ETH') setFee(String(r.data.fee))
        setGas((g) => ({ ...(g || {}), ...r.data }))
      }).catch(() => {})
    }
    marketApi
      .prices()
      .then((r) => {
        const row = (r.data || []).find((p) => (p.symbol || '').toUpperCase() === coin)
        setPrice(Number(row?.price_usd || 0))
      })
      .catch(() => setPrice(0))
  }, [coin])

  const review = (e) => {
    e.preventDefault()
    if (!addrCheck.ok) {
      toast.error(addrCheck.error)
      return
    }
    if (!pay || pay <= 0) {
      toast.error('Enter an amount greater than zero.')
      return
    }
    if (insufficient) {
      toast.error('Insufficient balance for this amount and network fee.')
      return
    }
    setStep('confirm')
  }

  const onSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const payload = { coin, address: address.trim(), amount: pay }
      if (needsFee && fee) payload.fee = Number(fee)
      const { data } = await walletApi.send(payload)
      setResult(data)
      setStep('done')
      toast.success(data.message || 'Transaction broadcast')
      if (address.trim() && !contacts.some((c) => c.address === address.trim())) {
        addContact({ name: `${address.slice(0, 6)}…${address.slice(-4)}`, address: address.trim(), coin })
      }
      const bal = await walletApi.balance(coin)
      setBalance(bal.data?.balance || 0)
    } catch (err) {
      toast.error(getApiError(err, 'Send failed'))
      setStep('form')
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
      {step === 'form' && (
        <form className={ui.panel} onSubmit={review}>
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
              <div className="mb-2 flex flex-wrap gap-2">
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
              autoComplete="off"
              spellCheck={false}
            />
            {address.trim() && !addrCheck.ok && (
              <div className={ui.hint} style={{ color: 'var(--red)', marginTop: 6 }}>{addrCheck.error}</div>
            )}
          </div>

          <div className={ui.row}>
            <div className={ui.label}>
              Amount
              <span className={ui.hint}>
                Available {formatBalance(balance)} {coin}
              </span>
            </div>
            <div className="flex gap-2">
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
            {insufficient && pay > 0 && (
              <div className={ui.hint} style={{ color: 'var(--red)', marginTop: 6 }}>
                Insufficient balance for amount{coin === 'USDT' ? ' plus ETH gas' : ' plus network fee'}.
              </div>
            )}
          </div>

          {needsFee && (
            <div className={ui.row}>
              <div className={ui.label}>Network fee ({coin})</div>
              <input className={ui.input} type="number" step="any" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          )}

          {(coin === 'ETH' || coin === 'USDT') && gas?.ok && (
            <div className={ui.warn}>
              Estimated gas ~{gas.gwei} gwei
              {gas.transfer_eth ? ` · ~${formatBalance(gas.transfer_eth, 6)} ETH` : ''}
              {coin === 'USDT' ? ' (paid in ETH)' : ''}
            </div>
          )}

          <button type="submit" disabled={loading || insufficient || !addrCheck.ok || !pay} className={ui.submit}>
            Review withdrawal
          </button>
        </form>
      )}

      {step === 'confirm' && (
        <div className={ui.panel}>
          <div className={ui.label} style={{ marginBottom: 12 }}>Confirm this send</div>
          <div className={ui.wlItem}><span>Asset</span><b>{coin}</b></div>
          <div className={ui.wlItem}><span>To</span><span className={ui.addr} style={{ margin: 0 }}>{address}</span></div>
          <div className={ui.wlItem}><span>Amount</span><b>{formatBalance(pay)} {coin}</b></div>
          <div className={ui.wlItem}><span>Network fee</span><b>{formatBalance(feeNum, 8)} {coin === 'USDT' ? 'ETH' : coin}</b></div>
          <div className={ui.warn} style={{ marginTop: 12 }}>
            This cannot be reversed after broadcast. Verify the address and network.
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className={ui.ghostBtn} disabled={loading} onClick={() => setStep('form')}>
              Back
            </button>
            <button type="button" className={ui.submit} disabled={loading} onClick={onSubmit}>
              {loading ? 'Broadcasting…' : `Send ${coin}`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result?.success && (
        <div className={ui.panel}>
          <div className={ui.label}>Broadcast successful</div>
          <p className={ui.hint} style={{ margin: '8px 0 12px' }}>{result.message}</p>
          <div className={ui.addr}>{result.txid}</div>
          <a href={explorerUrl(result.coin, result.txid)} target="_blank" rel="noreferrer" className={ui.link} style={{ display: 'inline-block', marginTop: 12 }}>
            View on explorer
          </a>
          <button
            type="button"
            className={cn(ui.submit, 'mt-4')}
            onClick={() => {
              setStep('form')
              setResult(null)
              setAmount('')
              setAddress('')
            }}
          >
            Send another
          </button>
        </div>
      )}
    </BinancePage>
  )
}
