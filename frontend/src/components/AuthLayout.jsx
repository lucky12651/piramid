import { Link } from 'react-router-dom'
import { ArrowUpRight, Layers, Wallet, Activity } from 'lucide-react'
import BrandLogo from './BrandLogo'

export default function AuthLayout({ children }) {
  return <div className="auth-layout">
    <aside className="auth-story">
      <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold"><BrandLogo size={36} /> Piramid</Link>
      <div className="auth-story-content">
        <span className="auth-kicker">A clearer view of your crypto</span>
        <h2>Your assets.<br />Your next move.</h2>
        <p>One workspace to follow the markets, manage your portfolio, and stay on top of your activity.</p>
        <div className="auth-feature"><Wallet size={20} /><div><strong>One place for your wallets</strong><span>Manage assets across supported networks.</span></div></div>
        <div className="auth-feature"><Activity size={20} /><div><strong>Keep the market in view</strong><span>Explore prices, charts, and your watchlist.</span></div></div>
        <div className="auth-feature"><Layers size={20} /><div><strong>Know where you stand</strong><span>Track your holdings and on-chain activity.</span></div></div>
      </div>
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60">Explore Piramid <ArrowUpRight size={16} /></Link>
    </aside>
    <main className="auth-form-area">{children}</main>
  </div>
}
