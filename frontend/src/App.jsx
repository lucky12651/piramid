import { useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Transactions from './pages/Transactions'
import SettingsProfile from './pages/SettingsProfile'
import SettingsSecurity from './pages/SettingsSecurity'
import Admin from './pages/Admin'
import Connect from './pages/Connect'
import Networks from './pages/Networks'
import Browser from './pages/Browser'
import Market from './pages/Market'
import Nfts from './pages/Nfts'
import Contacts from './pages/Contacts'
import Alerts from './pages/Alerts'
import AppLayout from './components/layout/AppLayout'

function Protected({ children, adminOnly = false }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !user?.is_admin) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  const location = useLocation()
  const background = useRef(null)
  const transfer = location.pathname === '/app/receive' ? 'deposit' : location.pathname === '/app/send' ? 'withdraw' : null
  if (!transfer) background.current = location
  const baseLocation = transfer ? background.current || { pathname: '/app' } : location
  return (
    <Routes location={baseLocation}>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout transfer={transfer} transferBackground={background.current} />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="activity" element={<Transactions />} />
        <Route path="connect" element={<Connect />} />
        <Route path="networks" element={<Networks />} />
        <Route path="market" element={<Market />} />
        <Route path="nfts" element={<Nfts />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="browser" element={<Browser />} />
        <Route path="settings" element={<Navigate to="/app/settings/profile" replace />} />
        <Route path="settings/profile" element={<SettingsProfile />} />
        <Route path="settings/security" element={<SettingsSecurity />} />
        <Route
          path="admin"
          element={
            <Protected adminOnly>
              <Admin />
            </Protected>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
