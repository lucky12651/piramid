import { Check } from 'lucide-react'
import { NETWORKS, useWalletStore } from '../store/useWalletStore'
import { cn } from '../lib/utils'
import { ui } from '../components/piramid/ui'
import toast from 'react-hot-toast'
import BinancePage from '../components/layout/BinancePage'

export default function Networks() {
  const networkId = useWalletStore((s) => s.networkId)
  const setNetwork = useWalletStore((s) => s.setNetwork)

  return (
    <BinancePage crumb="Networks" title="Networks" sub="Active chain for withdraw, deposit, and dApps.">
      <div className={ui.panel} style={{ padding: 0, overflow: 'hidden' }}>
        {NETWORKS.map((n) => {
          const active = n.id === networkId
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNetwork(n.id)
                toast.success(`Switched to ${n.name}`)
              }}
              className={cn(
                'flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]',
                active && 'bg-white/[0.04]'
              )}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-black"
                style={{ background: n.color }}
              >
                {n.symbol.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.name}</p>
                <p className="text-xs text-white/40">
                  {n.symbol}
                  {n.chainId != null ? ` · Chain ID ${n.chainId}` : ' · UTXO'}
                </p>
              </div>
              {active && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </BinancePage>
  )
}
