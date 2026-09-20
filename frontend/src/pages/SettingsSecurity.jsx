import { useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, Copy, EyeOff, Shield } from 'lucide-react'
import { authApi } from '../services/api'
import { copyText } from '../lib/utils'
import { ui } from '../components/piramid/ui'
import { useWalletStore } from '../store/useWalletStore'
import BinancePage, { Faq } from '../components/layout/BinancePage'

export default function SettingsSecurity() {
  const [bundle, setBundle] = useState(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [loadingPhrase, setLoadingPhrase] = useState(false)

  const loadSecrets = async () => {
    setLoadingPhrase(true)
    try {
      const { data } = await authApi.recoveryPhrase()
      setBundle(data)
      setShowSecrets(true)
      useWalletStore.getState().markBackupOk()
    } catch {
      toast.error('Unable to load recovery data')
    } finally {
      setLoadingPhrase(false)
    }
  }

  const copy = async (text, label) => {
    if (!text) return
    try {
      await copyText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <BinancePage
      crumb="Security"
      title="Security"
      sub="Recovery phrase, private keys, and backup."
      aside={
        <>
          <div className={ui.side}>
            <h3>Warning</h3>
            <div className={ui.warn}>
              Never share your recovery phrase or private keys. Anyone with them can take your funds.
            </div>
          </div>
          <Faq
            items={[
              { q: 'What should I back up?', a: 'Write down both phrases (BTC/LTC/DOGE and ETH/USDT) offline. Do not screenshot them.' },
              { q: 'Is this stored on Piramid servers in plaintext?', a: 'Reveal only on this device after you sign in. Treat the values as the master key to the wallet.' },
            ]}
          />
        </>
      }
    >
      <div className={ui.panel}>
        <div className={ui.label} style={{ marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} /> Recovery data
          </span>
        </div>
        <p className={ui.hint} style={{ marginBottom: 16 }}>
          Full backup for BTC, LTC, DOGE, ETH and USDT. Reveal only in a private place.
        </p>

        {!showSecrets ? (
          <button type="button" onClick={loadSecrets} disabled={loadingPhrase} className={ui.submit}>
            {loadingPhrase ? 'Loading…' : 'Reveal recovery data'}
          </button>
        ) : (
          <div>
            <SecretBlock
              title={bundle?.mnemonic_utxo?.label || 'BTC / LTC / DOGE phrase'}
              note={bundle?.mnemonic_utxo?.note}
              value={bundle?.mnemonic_utxo?.passphrase || bundle?.passphrase}
              onCopy={() => copy(bundle?.mnemonic_utxo?.passphrase || bundle?.passphrase, 'UTXO phrase')}
            />
            <SecretBlock
              title={bundle?.mnemonic_evm?.label || 'ETH / USDT phrase'}
              note={bundle?.mnemonic_evm?.note}
              value={bundle?.mnemonic_evm?.passphrase || bundle?.passphrase_eth}
              onCopy={() => copy(bundle?.mnemonic_evm?.passphrase || bundle?.passphrase_eth, 'ETH phrase')}
            />

            <div className={ui.row}>
              <div className={ui.label}>Deposit addresses</div>
              {Object.entries(bundle?.addresses || {}).map(([k, v]) => (
                <div key={k} className={ui.wlItem} style={{ paddingLeft: 0 }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{k}</div>
                    <div className="mt-px text-xs text-[var(--text-dimmer)]" style={{ fontFamily: 'monospace' }}>{v || '—'}</div>
                  </div>
                  {v && (
                    <button type="button" className={ui.link} onClick={() => copy(v, k)}>
                      Copy
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={ui.row}>
              <div className={ui.label}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--red)' }}>
                  <AlertTriangle size={14} /> Private keys
                </span>
              </div>
              {[
                { k: 'BTC_WIF', label: 'Bitcoin (WIF)' },
                { k: 'LTC_WIF', label: 'Litecoin (WIF)' },
                { k: 'DOGE_WIF', label: 'Dogecoin (WIF)' },
                { k: 'ETH', label: 'Ethereum (hex)' },
                { k: 'USDT', label: 'USDT ERC-20 (same as ETH)' },
              ].map(({ k, label }) => {
                const v = bundle?.private_keys?.[k]
                return (
                  <div key={k} className={ui.addr} style={{ marginBottom: 8 }}>
                    <div className={ui.label}>
                      {label}
                      {v && (
                        <button type="button" className={ui.link} onClick={() => copy(v, label)}>
                          <Copy size={12} /> Copy
                        </button>
                      )}
                    </div>
                    {v || 'Not available'}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className={ui.coin}
              onClick={() => {
                setShowSecrets(false)
                setBundle(null)
              }}
            >
              <EyeOff size={14} /> Hide secrets
            </button>
          </div>
        )}
      </div>
    </BinancePage>
  )
}

function SecretBlock({ title, note, value, onCopy }) {
  return (
    <div className={ui.addr} style={{ marginBottom: 12 }}>
      <div className={ui.label}>
        {title}
        <button type="button" className={ui.link} onClick={onCopy}>
          <Copy size={12} /> Copy
        </button>
      </div>
      {note && <div className={ui.hint} style={{ marginBottom: 8 }}>{note}</div>}
      {value || '(not stored for this account)'}
    </div>
  )
}
