/** Mount a TradingView embed and tear it down safely (avoids StrictMode races). */
export function mountTradingViewWidget(container, scriptSrc, config) {
  if (!container) return () => {}
  let cancelled = false
  const frame = requestAnimationFrame(() => {
    if (cancelled || !container.isConnected) return
    container.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.height = '100%'
    widget.style.width = '100%'
    container.appendChild(widget)
    const script = document.createElement('script')
    script.src = scriptSrc
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(config)
    container.appendChild(script)
  })
  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
    container.innerHTML = ''
  }
}
