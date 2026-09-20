import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { walletApi } from '../services/api'
import { explorerUrl, formatBalance, formatDate, shortAddress, cn } from '../lib/utils'
import { WALLET_COINS } from '../lib/coins'
import CoinIcon from '../components/piramid/CoinIcon'
import { ui } from '../components/piramid/ui'
import BinancePage from '../components/layout/BinancePage'

export default function Transactions() {
  const [coin, setCoin] = useState('BTC')
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    walletApi
      .transactions(coin)
      .then((r) => setTxs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTxs([]))
      .finally(() => setLoading(false))
  }, [coin])

  const filtered = txs.filter((tx) => {
    if (filter === 'all') return true
    return (tx.transaction_type || '').toLowerCase() === filter
  })

  return (
    <BinancePage crumb="History" title="Transaction History" sub="On-chain activity for the selected asset." wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {WALLET_COINS.map((c) => (
          <button key={c} type="button" className={cn(ui.coin, coin === c && ui.coinOn)} onClick={() => setCoin(c)}>
            <CoinIcon symbol={c} />
            {c}
          </button>
        ))}
        <span style={{ width: 8 }} />
        {[
          { id: 'all', label: 'All' },
          { id: 'received', label: 'Deposit' },
          { id: 'sent', label: 'Withdraw' },
        ].map((f) => (
          <button key={f.id} type="button" className={cn(ui.coin, filter === f.id && ui.coinOn)} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Coin</th>
              <th>Amount</th>
              <th>TxID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--text-dimmer)' }}>Loading…</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--text-dimmer)' }}>No records for {coin}</td>
              </tr>
            )}
            {filtered.map((tx) => {
              const recv = (tx.transaction_type || '').toLowerCase() === 'received'
              return (
                <tr key={tx.txid + String(tx.date)}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{recv ? 'Deposit' : 'Withdraw'}</td>
                  <td>{tx.coin}</td>
                  <td style={{ color: recv ? 'var(--green)' : 'var(--text)', fontWeight: 700 }}>
                    {recv ? '+' : '−'}
                    {formatBalance(tx.amount)} {tx.coin}
                  </td>
                  <td>
                    <a href={explorerUrl(tx.coin, tx.txid)} target="_blank" rel="noreferrer" className={ui.link} style={{ fontFamily: 'monospace' }}>
                      {shortAddress(tx.txid, 10, 8)} <ExternalLink size={11} />
                    </a>
                  </td>
                  <td>{tx.status}{tx.confirmations ? ` · ${tx.confirmations} conf` : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </BinancePage>
  )
}
