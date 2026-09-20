import { Toaster } from 'react-hot-toast'
import { useUiTheme } from '../lib/theme'

export default function ThemeToaster() {
  const { light } = useUiTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: light
          ? {
              background: '#ffffff',
              color: '#1e2329',
              border: '1px solid #e6e8eb',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 12px 32px rgba(20, 24, 18, 0.12)',
            }
          : {
              background: '#151519',
              color: '#f5f5f7',
              border: '1px solid rgba(215, 242, 76, 0.18)',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 24px rgba(215, 242, 76, 0.08)',
            },
      }}
    />
  )
}
