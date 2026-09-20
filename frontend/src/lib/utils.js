import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function shortAddress(addr, left = 6, right = 4) {
  if (!addr) return '—'
  if (addr.length <= left + right + 3) return addr
  return `${addr.slice(0, left)}…${addr.slice(-right)}`
}

export function formatBalance(value, digits = 8) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (n === 0) return '0'
  if (n < 0.000001) return n.toExponential(2)
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

export function formatUsd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '$0.00'
  if (n > 0 && n < 0.01) {
    return n.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumSignificantDigits: 4,
    })
  }
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

export function explorerUrl(coin, txid) {
  if (!txid) return '#'
  const c = (coin || '').toUpperCase()
  if (c === 'BTC') return `https://mempool.space/tx/${txid}`
  if (c === 'LTC') return `https://litecoinspace.org/tx/${txid}`
  if (c === 'DOGE') return `https://live.blockcypher.com/doge/tx/${txid}`
  if (c === 'ETH' || c === 'USDT') return `https://etherscan.io/tx/${txid}`
  return '#'
}

export function coinMeta(coin) {
  const map = {
    BTC: { name: 'Bitcoin', color: 'from-orange-400/20 to-orange-600/5', accent: 'text-orange-300' },
    LTC: { name: 'Litecoin', color: 'from-slate-300/20 to-slate-500/5', accent: 'text-slate-200' },
    ETH: { name: 'Ethereum', color: 'from-indigo-400/20 to-indigo-600/5', accent: 'text-indigo-300' },
    DOGE: { name: 'Dogecoin', color: 'from-yellow-400/20 to-yellow-600/5', accent: 'text-yellow-300' },
    USDT: { name: 'Tether', color: 'from-emerald-400/20 to-emerald-600/5', accent: 'text-emerald-300' },
    BNB: { name: 'BNB', color: 'from-yellow-400/20 to-yellow-600/5', accent: 'text-yellow-300' },
    SOL: { name: 'Solana', color: 'from-emerald-400/20 to-cyan-500/5', accent: 'text-emerald-300' },
  }
  return map[(coin || '').toUpperCase()] || { name: coin, color: 'from-white/10 to-transparent', accent: 'text-white' }
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text)
}
