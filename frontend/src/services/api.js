import axios from 'axios'

// Paths below already include `/api/...`. If a host sets VITE_API_URL=/api
// (common PaaS default), strip it so we never call `/api/api/...` (404).
const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
const baseURL = rawBase === '/api' ? '' : rawBase

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = String(err.config?.url || '')
      if (url.includes('/api/auth/login')) {
        return Promise.reject(err)
      }
      localStorage.removeItem('cc_token')
      localStorage.removeItem('cc_user')
      const path = window.location.pathname
      if (path.startsWith('/app')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/api/auth/register', data, { timeout: 180_000 }),
  login: (data) => api.post('/api/auth/login', data, { timeout: 30_000 }),
  me: () => api.get('/api/auth/me'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  recoveryPhrase: (password) => api.post('/api/auth/recovery-phrase', { password }),
}

export const walletApi = {
  addresses: () => api.get('/api/wallet/addresses'),
  balance: (coin) => api.get('/api/wallet/balance', { params: { coin } }),
  balances: () => api.get('/api/wallet/balances'),
  send: (data) => api.post('/api/wallet/send', data, { timeout: 90_000 }),
  transactions: (coin) => api.get('/api/wallet/transactions', { params: { coin } }),
  sendHistory: () => api.get('/api/wallet/send-history'),
  gas: () => api.get('/api/wallet/gas'),
  estimateFee: (coin) => api.get('/api/wallet/estimate-fee', { params: { coin } }),
  validateAddress: (data) => api.post('/api/wallet/validate-address', data),
  nfts: () => api.get('/api/wallet/nfts'),
}

export const adminApi = {
  stats: () => api.get('/api/admin/stats'),
  users: (q) => api.get('/api/admin/users', { params: q ? { q } : {} }),
  updateUser: (id, data) => api.patch(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  transactions: (limit = 50) => api.get('/api/admin/transactions', { params: { limit } }),
}

export const marketApi = {
  prices: () => api.get('/api/market/prices'),
}

export default api
