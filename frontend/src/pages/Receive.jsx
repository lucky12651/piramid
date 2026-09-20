import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { walletApi } from '../services/api'
import { copyText } from '../lib/utils'
import { WALLET_COINS } from '../lib/coins'
import CoinIcon from '../components/piramid/CoinIcon'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'
import BinancePage, { Faq, TransferTabs } from '../components/layout/BinancePage'

const NOTES = {
  BTC: 'This address accepts Bitcoin (BTC) only.',
  LTC: 'This address accepts Litecoin (LTC) only.',
  DOGE: 'This address accepts Dogecoin (DOGE) only.',
  ETH: 'This address accepts Ethereum (ETH) only.',
  USDT: 'USDT is ERC-20. Send only USDT on Ethereum to this address.',
}

export default function Receive() {
  const [coin, setCoin] = useState('BTC')
  const [addresses, setAddresses] = useState({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    walletApi.addresses().then((r) => setAddresses(r.data || {})).catch(() => toast.error('Failed to load addresses'))
  }, [])

  const address = addresses[coin] || ''

  const onCopy = async () => {
    if (!address) return
    try {
      await copyText(address)
      setCopied(true)
      toast.success('Address copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <BinancePage
      crumb="Deposit"
      title="Deposit"
      sub="Share your address or QR code to receive crypto."
      tabs={<TransferTabs />}
      aside={
        <>
          <div className={ui.side}>
            <h3>Important</h3>
            <div className={ui.warn}>{NOTES[coin]} Sending the wrong asset or network can result in permanent loss.</div>
          </div>
          <Faq
            items={[
              { q: 'How many confirmations are needed?', a: 'Deposits appear after the network confirms the transaction. BTC typically needs more confirmations than ETH.' },
              { q: 'Can I reuse this address?', a: 'Yes. Your Piramid address for each coin stays the same.' },
              { q: 'USDT network?', a: 'USDT here is ERC-20 on Ethereum, using the same address as ETH.' },
            ]}
          />
        </>
      }
    >
      <div className={ui.panel}>
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
          <div className={ui.label}>Network</div>
          <div className={ui.input} style={{ fontWeight: 700 }}>
            {coin === 'USDT' ? 'Ethereum (ERC-20)' : coin === 'ETH' ? 'Ethereum' : coin === 'BTC' ? 'Bitcoin' : coin === 'LTC' ? 'Litecoin' : 'Dogecoin'}
          </div>
        </div>

        <div className={ui.row} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
            {address ? (
              <QRCodeSVG value={address} size={160} level="M" includeMargin={false} />
            ) : (
              <div style={{ width: 160, height: 160, display: 'grid', placeItems: 'center', color: '#999' }}>…</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className={ui.label}>Deposit address</div>
            <div className={ui.addr}>{address || 'Loading…'}</div>
            <button type="button" className={ui.submit} style={{ marginTop: 12 }} onClick={onCopy} disabled={!address}>
              {copied ? 'Copied' : 'Copy address'}
            </button>
          </div>
        </div>
      </div>
    </BinancePage>
  )
}
