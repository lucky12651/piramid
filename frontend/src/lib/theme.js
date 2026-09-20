import { useWalletStore } from '../store/useWalletStore'

/** Shared TradingView / toast palette that follows the app theme. */
export function useUiTheme() {
  const theme = useWalletStore((s) => s.theme)
  const light = theme === 'light'
  return {
    theme,
    light,
    tvTheme: light ? 'light' : 'dark',
    backgroundColor: light ? '#ffffff' : '#111114',
    gridColor: light ? 'rgba(226, 230, 220, 1)' : 'rgba(28, 28, 34, 1)',
    fontColor: light ? 'rgba(30, 35, 41, 0.88)' : 'rgba(245, 245, 247, 0.9)',
  }
}
