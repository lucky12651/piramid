import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Send from './pages/Send'
import Receive from './pages/Receive'
import Transactions from './pages/Transactions'
import SettingsProfile from './pages/SettingsProfile'
import SettingsSecurity from './pages/SettingsSecurity'
import Admin from './pages/Admin'
import Connect from './pages/Connect'
import Networks from './pages/Networks'
import Swap from './pages/Swap'
import Browser from './pages/Browser'
import Market from './pages/Market'
import Calendar from './pages/Calendar'
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
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="send" element={<Send />} />
        <Route path="receive" element={<Receive />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="activity" element={<Transactions />} />
        <Route path="connect" element={<Connect />} />
        <Route path="networks" element={<Networks />} />
        <Route path="swap" element={<Swap />} />
        <Route path="market" element={<Market />} />
        <Route path="nfts" element={<Nfts />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="calendar" element={<Calendar />} />
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
