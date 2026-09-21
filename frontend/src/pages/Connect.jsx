import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Link2, Shield, Unplug } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useWalletStore } from '../store/useWalletStore'
import { cn, shortAddress } from '../lib/utils'
import BinancePage from '../components/layout/BinancePage'
import { ui } from '../components/piramid/ui'

const DEMO_DAPPS = [
  {
    origin: 'https://app.uniswap.org',
    name: 'Uniswap',
    icon: '🦄',
    permissions: ['eth_accounts', 'eth_sendTransaction', 'personal_sign'],
  },
  {
    origin: 'https://opensea.io',
    name: 'OpenSea',
    icon: '🌊',
    permissions: ['eth_accounts', 'eth_requestAccounts'],
  },
  {
    origin: 'https://aave.com',
    name: 'Aave',
    icon: '👻',
    permissions: ['eth_accounts', 'eth_sendTransaction'],
  },
  {
    origin: 'https://app.ens.domains',
    name: 'ENS',
    icon: '◈',
    permissions: ['eth_accounts', 'personal_sign'],
  },
]

/** Local allow-list of sites you marked on this device. Not a live WalletConnect session. */
export default function Connect() {
  const user = useAuthStore((s) => s.user)
  const network = useWalletStore((s) => s.getNetwork())
  const connectedSites = useWalletStore((s) => s.connectedSites)
  const connectSite = useWalletStore((s) => s.connectSite)
  const disconnectSite = useWalletStore((s) => s.disconnectSite)
  const [pending, setPending] = useState(null)
  const [manualOrigin, setManualOrigin] = useState('')

  const requestConnect = (dapp) => {
    setPending(dapp)
  }

  const approve = () => {
    if (!pending) return
    connectSite({
      origin: pending.origin,
      name: pending.name,
      icon: pending.icon,
      permissions: pending.permissions,
      network: network.id,
      address: user?.wallet_address_eth || user?.wallet_address_btc,
    })
    toast.success(`Connected to ${pending.name}`)
    setPending(null)
  }

  const reject = () => {
    toast('Connection rejected')
    setPending(null)
  }

  const connectManual = () => {
    const origin = manualOrigin.trim()
    if (!origin) {
      toast.error('Enter a site URL')
      return
    }
    let name = origin
    try {
      name = new URL(origin.startsWith('http') ? origin : `https://${origin}`).hostname
    } catch {
      /* keep raw */
    }
    requestConnect({
      origin: origin.startsWith('http') ? origin : `https://${origin}`,
      name,
      icon: '🔗',
      permissions: ['eth_accounts', 'eth_requestAccounts'],
    })
  }

  return (
    <BinancePage crumb="Connect" title="Connected sites" sub="A local allow-list on this device. Piramid does not open a live WalletConnect session.">
      <div className={cn(ui.warn, 'mb-6')}>
        Marking a site here does not sign transactions in that dApp. Use Withdraw in Piramid for real on-chain sends.
      </div>

      <div className={cn(ui.card, 'mb-4')}>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-[var(--text-dim)]" /> Connect a site
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            className={ui.input}
            placeholder="https://app.example.com"
            value={manualOrigin}
            onChange={(e) => setManualOrigin(e.target.value)}
          />
          <button type="button" onClick={connectManual} className={cn(ui.submit, 'mt-0 w-auto shrink-0 px-4')}>
            Connect
          </button>
        </div>
      </div>

      <div className={cn(ui.card, 'mb-4 overflow-hidden p-0')}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <h2 className="text-sm font-medium">Popular dApps</h2>
          <p className="text-[11px] text-[var(--text-dimmer)]">One-tap connection request</p>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {DEMO_DAPPS.map((d) => {
            const active = connectedSites.some((s) => s.origin === d.origin)
            return (
              <div key={d.origin} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted-bg)] text-lg">
                  {d.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-[var(--text-dimmer)]">{d.origin}</p>
                </div>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-bg)] px-2.5 py-1 text-[11px] font-semibold text-gain">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestConnect(d)}
                    className={cn(ui.ghostBtn, 'h-9 flex-none px-3 text-xs')}
                  >
                    Connect
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Connected sites */}
      <div className={cn(ui.card, 'overflow-hidden p-0')}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <h2 className="text-sm font-medium">Connected sites</h2>
          <p className="text-[11px] text-[var(--text-dimmer)]">
            {connectedSites.length} site{connectedSites.length === 1 ? '' : 's'}
          </p>
        </div>
        {connectedSites.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--text-dimmer)]">
            No connected sites yet
          </p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {connectedSites.map((s) => (
              <div key={s.origin} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted-bg)] text-lg">
                  {s.icon || '🔗'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-[var(--text-dimmer)]">{s.origin}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--text-dimmer)]">
                    {shortAddress(s.address)} · {s.network}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnectSite(s.origin)
                    toast.success(`Disconnected ${s.name}`)
                  }}
                  className="inline-flex h-9 items-center rounded-xl border border-red-500/30 bg-[var(--red-bg)] px-2.5 text-xs text-loss"
                >
                  <Unplug className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection approval modal */}
      {pending && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--sidebar-bg)] p-6 shadow-2xl">
            <div className="text-center">
              <span className="text-4xl">{pending.icon}</span>
              <h3 className="mt-3 text-lg font-semibold">{pending.name}</h3>
              <p className="mt-1 text-xs text-[var(--text-dimmer)]">{pending.origin}</p>
              <p className="mt-4 text-sm text-[var(--text-dim)]">
                wants to connect to your Piramid wallet
              </p>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--muted-bg)] p-4 text-xs text-[var(--text-dim)]">
              <p className="flex items-center gap-2 font-medium text-[var(--text)]">
                <Shield className="h-4 w-4" /> Permissions
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>View your account address</li>
                <li>Request transaction approvals</li>
                {(pending.permissions || []).map((p) => (
                  <li key={p} className="font-mono text-[10px] text-[var(--text-dimmer)]">
                    {p}
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-[var(--text-dimmer)]">
                Network: <span className="text-[var(--text)]">{network.name}</span>
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={reject} className={ui.ghostBtn}>
                Reject
              </button>
              <button type="button" onClick={approve} className={ui.limeBtn}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </BinancePage>
  )
}
