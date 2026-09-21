/** Mount a TradingView embed and tear it down safely (avoids StrictMode races). */
export function mountTradingViewWidget(container, scriptSrc, config) {
  if (!container) return () => {}
  let cancelled = false
  const frame = requestAnimationFrame(() => {
    if (cancelled || !container.isConnected) return
    container.innerHTML = ''

    const boxH = Math.round(container.clientHeight || 0)
    const boxW = Math.round(container.clientWidth || 0)
    const height =
      typeof config.height === 'number' && config.height > 0
        ? config.height
        : boxH > 80
          ? boxH
          : 560
    const width =
      config.width && config.width !== '100%'
        ? config.width
        : boxW > 80
          ? boxW
          : '100%'

    const resolved = {
      ...config,
      width,
      height,
      isTransparent: false,
      colorTheme: config.colorTheme || config.theme || 'dark',
    }

    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.display = 'block'
    widget.style.width = '100%'
    widget.style.height = typeof height === 'number' ? `${height}px` : '100%'
    container.appendChild(widget)

    const script = document.createElement('script')
    const sep = scriptSrc.includes('?') ? '&' : '?'
    script.src = `${scriptSrc}${sep}v=${Date.now()}`
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(resolved)
    container.appendChild(script)
  })
  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
    container.innerHTML = ''
  }
}
