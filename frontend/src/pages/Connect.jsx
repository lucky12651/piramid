import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Link2, QrCode, Shield, Unplug } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuthStore } from '../store/useAuthStore'
import { useWalletStore } from '../store/useWalletStore'
import { shortAddress } from '../lib/utils'
import BinancePage from '../components/layout/BinancePage'

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

/**
 * MetaMask-style dApp connection + WalletConnect-like session UI.
 * Sessions are stored locally (WalletConnect URI mock for UX parity).
 */
export default function Connect() {
  const user = useAuthStore((s) => s.user)
  const network = useWalletStore((s) => s.getNetwork())
  const connectedSites = useWalletStore((s) => s.connectedSites)
  const connectSite = useWalletStore((s) => s.connectSite)
  const disconnectSite = useWalletStore((s) => s.disconnectSite)
  const [pending, setPending] = useState(null)
  const [manualOrigin, setManualOrigin] = useState('')

  const wcUri = useMemo(() => {
    // Demo WalletConnect-style URI (not a live WC session)
    const topic = btoa(`${user?.id || '0'}-${Date.now()}`).slice(0, 16)
    return `wc:${topic}@2?relay-protocol=irn&symKey=demo${(user?.username || 'user').slice(0, 8)}`
  }, [user?.id, user?.username, pending])

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
    <BinancePage crumb="Connect" title="Connect" sub="Link dApps. Sessions stay on this device.">

      {/* WalletConnect-style card */}
      <div className="x-card mb-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3396FF]/15 text-[#3396FF]">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium">WalletConnect</h2>
            <p className="mt-0.5 text-xs text-white/40">
              Share this session URI with a WalletConnect-enabled dApp (demo mode)
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-2xl border border-white/10 bg-white p-3">
            <QRCodeSVG value={wcUri} size={140} level="M" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-all rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-white/60">
              {wcUri}
            </p>
            <button
              type="button"
              className="x-btn-secondary mt-3 text-xs"
              onClick={async () => {
                await navigator.clipboard.writeText(wcUri)
                toast.success('URI copied')
              }}
            >
              Copy URI
            </button>
          </div>
        </div>
      </div>

      {/* Manual connect */}
      <div className="x-card mb-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-white/50" /> Connect a site
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            className="x-input"
            placeholder="https://app.example.com"
            value={manualOrigin}
            onChange={(e) => setManualOrigin(e.target.value)}
          />
          <button type="button" onClick={connectManual} className="x-btn-primary shrink-0">
            Connect
          </button>
        </div>
      </div>

      {/* Popular dApps */}
      <div className="x-card mb-4 overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-medium">Popular dApps</h2>
          <p className="text-[11px] text-white/35">One-tap connection request</p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {DEMO_DAPPS.map((d) => {
            const active = connectedSites.some((s) => s.origin === d.origin)
            return (
              <div key={d.origin} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
                  {d.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-white/35">{d.origin}</p>
                </div>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestConnect(d)}
                    className="x-btn-secondary px-3 py-1.5 text-xs"
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
      <div className="x-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-medium">Connected sites</h2>
          <p className="text-[11px] text-white/35">
            {connectedSites.length} site{connectedSites.length === 1 ? '' : 's'}
          </p>
        </div>
        {connectedSites.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-white/35">
            No connected sites yet
          </p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {connectedSites.map((s) => (
              <div key={s.origin} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
                  {s.icon || '🔗'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-white/35">{s.origin}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/25">
                    {shortAddress(s.address)} · {s.network}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnectSite(s.origin)
                    toast.success(`Disconnected ${s.name}`)
                  }}
                  className="x-btn-danger px-2.5 py-1.5 text-xs"
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
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <div className="text-center">
              <span className="text-4xl">{pending.icon}</span>
              <h3 className="mt-3 text-lg font-semibold">{pending.name}</h3>
              <p className="mt-1 text-xs text-white/40">{pending.origin}</p>
              <p className="mt-4 text-sm text-white/60">
                wants to connect to your Piramid wallet
              </p>
            </div>

            <div className="mt-5 space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-white/55">
              <p className="flex items-center gap-2 font-medium text-white/80">
                <Shield className="h-4 w-4" /> Permissions
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>View your account address</li>
                <li>Request transaction approvals</li>
                {(pending.permissions || []).map((p) => (
                  <li key={p} className="font-mono text-[10px] text-white/35">
                    {p}
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-white/40">
                Network: <span className="text-white/70">{network.name}</span>
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={reject} className="x-btn-secondary py-3">
                Reject
              </button>
              <button type="button" onClick={approve} className="x-btn-primary py-3">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </BinancePage>
  )
}
