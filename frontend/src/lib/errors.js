/** Human-readable message from axios / FastAPI errors */
export function getApiError(err, fallback = 'Request failed') {
  if (!err) return fallback

  // Backend not running / CORS / network
  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Wallet creation can take up to a minute — try again.'
    }
    return 'Cannot reach the server. Start the backend on http://127.0.0.1:8000 and try again.'
  }

  const detail = err.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail

  // FastAPI validation: detail is an array of {loc, msg, type}
  if (Array.isArray(detail)) {
    return detail
      .map((d) => d.msg || d.message || JSON.stringify(d))
      .filter(Boolean)
      .join('; ') || fallback
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail)
  }

  if (err.response?.status === 401) return 'Invalid email or password'
  if (err.response?.status === 403) return 'Access denied'
  if (err.response?.status === 429) return 'Too many attempts. Please wait a moment.'
  if (err.response?.status >= 500) return 'Something went wrong. Please try again.'

  return err.message || fallback
}
