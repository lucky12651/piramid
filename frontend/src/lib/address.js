const BTC_P2PKH = /^[13][a-km-zA-HJ-NP-Z1-9]{24,39}$/
const BTC_BECH32 = /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,87}$/i
const LTC_LEGACY = /^[LM3][a-km-zA-HJ-NP-Z1-9]{24,39}$/
const LTC_BECH32 = /^ltc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,87}$/i
const DOGE = /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{24,39}$/
const ETH = /^0x[0-9a-fA-F]{40}$/

export function validateAddress(coin, address) {
  const c = (coin || '').toUpperCase()
  const addr = (address || '').trim()
  if (!addr) return { ok: false, error: 'Enter a destination address.' }
  if (c === 'BTC') {
    if (BTC_P2PKH.test(addr) || BTC_BECH32.test(addr)) return { ok: true }
    return { ok: false, error: 'That is not a valid Bitcoin address.' }
  }
  if (c === 'LTC') {
    if (LTC_LEGACY.test(addr) || LTC_BECH32.test(addr)) return { ok: true }
    return { ok: false, error: 'That is not a valid Litecoin address.' }
  }
  if (c === 'DOGE') {
    if (DOGE.test(addr)) return { ok: true }
    return { ok: false, error: 'That is not a valid Dogecoin address.' }
  }
  if (c === 'ETH' || c === 'USDT') {
    if (!ETH.test(addr)) return { ok: false, error: 'That is not a valid Ethereum address.' }
    return { ok: true }
  }
  return { ok: false, error: 'Unsupported asset.' }
}
