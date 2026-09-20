export function synthSpark(symbol, change) {
  const n = 18
  const seed = [...String(symbol || 'X')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const dir = Number(change) >= 0 ? 1 : -1
  const mag = Math.min(3.2, Math.abs(Number(change) || 1) * 0.1)
  const pts = []
  let v = 14
  for (let i = 0; i < n; i++) {
    const jitter = ((seed * (i + 3)) % 10) / 10 - 0.42
    const wave = Math.sin(i / 2.4 + seed / 11) * 1.4
    v += dir * mag + jitter * 1.6 + wave * 0.15
    pts.push(v)
  }
  return pts
}

export default function Sparkline({ points = [], pos = true, width = 86, height = 36 }) {
  if (!points.length) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((v - min) / span) * (height - 6) - 3
    return [x, y]
  })
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  const color = pos ? '#3ddc84' : '#f36969'
  const gid = `sp-${pos ? 'g' : 'r'}-${width}`
  return (
    <svg className="shrink-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
