import { useEffect, useState } from 'react'
import { walletApi } from '../services/api'
import { shortAddress } from '../lib/utils'
import { ui } from '../components/piramid/ui'
import BinancePage from '../components/layout/BinancePage'

export default function Nfts() {
  const [items, setItems] = useState([])
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    walletApi
      .nfts()
      .then((r) => {
        setItems(r.data?.items || [])
        setAddress(r.data?.address || '')
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <BinancePage
      crumb="NFT"
      title="NFT"
      sub={`Collectibles on ${address ? shortAddress(address, 8, 6) : 'your Ethereum address'}.`}
      wide
    >
      {loading && <div className={ui.panel}>Loading collectibles…</div>}
      {!loading && items.length === 0 && (
        <div className={ui.panel} style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No NFTs yet</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            ERC-721 / ERC-1155 tokens on this address appear here automatically.
          </p>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {items.map((n) => (
          <a
            key={`${n.contract}-${n.token_id}`}
            className={ui.card}
            href={n.contract ? `https://opensea.io/assets/ethereum/${n.contract}/${n.token_id}` : '#'}
            target="_blank"
            rel="noreferrer"
          >
            {n.image ? <img src={n.image} alt="" /> : <div className="nft-ph" />}
            <div className="nft-meta">
              <b>{n.name}</b>
              <span>
                {n.collection} · {n.type}
              </span>
            </div>
          </a>
        ))}
      </div>
    </BinancePage>
  )
}
