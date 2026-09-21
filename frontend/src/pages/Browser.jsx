import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import BinancePage from '../components/layout/BinancePage'
import { ui } from '../components/piramid/ui'

const EXPLORE = [
  {
    name: 'Uniswap',
    desc: 'Swap tokens on Ethereum',
    url: 'https://app.uniswap.org',
    color: 'from-pink-500/20 to-pink-600/5',
  },
  {
    name: 'OpenSea',
    desc: 'NFT marketplace',
    url: 'https://opensea.io',
    color: 'from-blue-500/20 to-blue-600/5',
  },
  {
    name: 'Aave',
    desc: 'Lend & borrow',
    url: 'https://app.aave.com',
    color: 'from-purple-500/20 to-purple-600/5',
  },
  {
    name: 'mempool.space',
    desc: 'Bitcoin explorer',
    url: 'https://mempool.space',
    color: 'from-orange-500/20 to-orange-600/5',
  },
  {
    name: 'Etherscan',
    desc: 'Ethereum explorer',
    url: 'https://etherscan.io',
    color: 'from-indigo-500/20 to-slate-600/5',
  },
  {
    name: 'Litecoin Space',
    desc: 'Litecoin explorer',
    url: 'https://litecoinspace.org',
    color: 'from-slate-400/20 to-slate-600/5',
  },
]

export default function Browser() {
  return (
    <BinancePage
      crumb="Discover"
      title="Discover"
      sub={
        <>
          Popular dApps and explorers.{' '}
          <Link to="/app/connect" className={ui.link}>
            Connect
          </Link>{' '}
          before you sign.
        </>
      }
      wide
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {EXPLORE.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={`${ui.card} group relative overflow-hidden bg-gradient-to-br p-5 transition hover:border-accent/40 ${item.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-medium">{item.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-dim)]">{item.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-[var(--text-dimmer)] group-hover:text-[var(--text)]" />
            </div>
          </a>
        ))}
      </div>
    </BinancePage>
  )
}
