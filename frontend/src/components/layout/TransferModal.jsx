import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import Send from '../../pages/Send'
import Receive from '../../pages/Receive'
import { TransferModalContext } from './BinancePage'

export default function TransferModal({ kind, background }) {
  const dialog = useRef(null)
  const navigate = useNavigate()
  const close = () => {
    if (background) navigate(-1)
    else navigate('/app', { replace: true })
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const trigger = document.activeElement
    document.body.style.overflow = 'hidden'
    dialog.current.showModal()
    return () => {
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  return <dialog ref={dialog} className="transfer-modal" aria-labelledby="transfer-title"
    onCancel={(event) => { event.preventDefault(); close() }}
    onClick={(event) => {
      if (event.target !== dialog.current) return
      const rect = dialog.current.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
    }}>
    <div className="transfer-modal-header">
      <h2 id="transfer-title">{kind === 'deposit' ? 'Deposit crypto' : 'Withdraw crypto'}</h2>
      <button type="button" aria-label="Close transfer" onClick={close}><X size={20} /></button>
    </div>
    <TransferModalContext.Provider value={kind}>
      {kind === 'deposit' ? <Receive /> : <Send />}
    </TransferModalContext.Provider>
  </dialog>
}
