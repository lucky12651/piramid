import { Eye, EyeOff } from 'lucide-react'
import { useWalletStore } from '../store/useWalletStore'
import BinancePage, { Faq } from '../components/layout/BinancePage'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

export default function Settings() {
  const hideBalances = useWalletStore((s) => s.hideBalances)
  const toggleHideBalances = useWalletStore((s) => s.toggleHideBalances)
  const autoLockMinutes = useWalletStore((s) => s.autoLockMinutes)
  const setAutoLockMinutes = useWalletStore((s) => s.setAutoLockMinutes)

  return (
    <BinancePage
      crumb="Settings"
      title="Preferences"
      sub="Hide balances and auto-lock. Profile and Security are in the account menu."
      aside={
        <Faq
          items={[
            { q: 'Where is Profile and Security?', a: 'Open the account menu in the top bar, then choose Profile or Security.' },
            { q: 'What does auto-lock do?', a: 'After the idle time you choose, this device locks until you unlock it.' },
          ]}
        />
      }
    >
      <div className={ui.panel}>
        <div className={ui.row}>
          <div className={ui.label}>Hide balances</div>
          <button type="button" className={cn(ui.coin, hideBalances && ui.coinOn)} onClick={toggleHideBalances}>
            {hideBalances ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideBalances ? 'Hidden' : 'Visible'}
          </button>
        </div>
        <div className={ui.row}>
          <div className={ui.label}>Auto-lock</div>
          <select
            className={ui.input}
            value={autoLockMinutes}
            onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
          >
            <option value={0}>Off</option>
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
      </div>
    </BinancePage>
  )
}
