import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, LineChart, Shield, Wallet, Zap } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import BrandLogo from '../components/BrandLogo'
import CoinIcon from '../components/piramid/CoinIcon'
import { ui } from '../components/piramid/ui'
import { cn } from '../lib/utils'

const features = [
  {
    icon: LineChart,
    title: 'Live market terminal',
    desc: 'Bitstamp candles, watchlists, and sparklines in a single dark workspace.',
  },
  {
    icon: Wallet,
    title: 'Self-custody wallets',
    desc: 'BTC, LTC, ETH, DOGE, and USDT addresses created the moment you sign up.',
  },
  {
    icon: Zap,
    title: 'Deposit & withdraw',
    desc: 'Top up, send on-chain, and convert with live USD quotes from the same shell.',
  },
  {
    icon: Shield,
    title: 'Keys stay yours',
    desc: 'Recovery phrase and private keys surface only to you — lock the wallet anytime.',
  },
]

export default function Landing() {
  const token = useAuthStore((s) => s.token)

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f5f5f7] [background:radial-gradient(ellipse_60%_44%_at_90%_-10%,rgba(215,242,76,0.22),transparent_55%),#0a0a0c]">
      <header className="sticky top-0 z-20 flex items-center gap-6 border-b border-[#232329] bg-[#0a0a0c]/80 px-8 py-[18px] backdrop-blur-xl">
        <Link to="/" className={ui.logo}>
          <BrandLogo size={32} />
          <div>
            <div className={ui.logoText}>Piramid</div>
            <div className={ui.logoSub}>Trade at the Speed of Now</div>
          </div>
        </Link>
        <nav className="hidden flex-1 gap-[22px] text-[13.5px] font-semibold text-[#9a9aa3] sm:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#terminal" className="hover:text-white">Terminal</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {token ? (
            <Link to="/app" className={ui.deposit}>
              Open terminal <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden px-3 py-2 text-sm text-[#9a9aa3] hover:text-white sm:inline-flex">
                Sign in
              </Link>
              <Link to="/register" className={ui.deposit}>
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-7 pt-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[#9a9aa3]">
            <span className="live-dot" />
            Live crypto terminal
          </div>
          <h1 className="mb-4 text-[clamp(40px,6vw,64px)] font-extrabold leading-[1.05] tracking-tight">
            Trade at the
            <br />
            <span className="text-accent [text-shadow:0_0_40px_rgba(215,242,76,0.35)]">speed of now.</span>
          </h1>
          <p className="mb-7 max-w-[540px] text-base leading-relaxed text-[#9a9aa3]">
            A charcoal trading desk for your self-custody wallet — balances, live pairs, and
            Bitstamp candles with the same lime-accent polish as a pro terminal.
          </p>
          <div className="mb-12 flex flex-wrap gap-2.5">
            <Link to={token ? '/app' : '/register'} className={cn(ui.deposit, 'px-[22px] py-3')}>
              {token ? 'Open dashboard' : 'Create wallet'}
              <ArrowRight size={16} />
            </Link>
            <a href="#terminal" className={cn(ui.ghostBtn, 'flex-none px-[22px] py-3')}>
              See the desk
            </a>
          </div>
        </motion.div>

        <motion.div
          id="terminal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="grid gap-3.5 md:grid-cols-[1.2fr_0.9fr_0.9fr]"
        >
          <div className={ui.card}>
            <div className="mb-3 flex items-center gap-2.5">
              <div className={ui.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <span className={ui.title}>My Balance</span>
            </div>
            <div className="text-[28px] font-extrabold tracking-tight">$8,329.77</div>
            <div className="mt-3.5 flex gap-6">
              <div>
                <div className="mb-1 text-[11px] text-[#5c5c66]">Total Profit</div>
                <div className="text-[13.5px] font-bold text-gain">+$3,749.21</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] text-[#5c5c66]">Avg. Growing</div>
                <div className="text-[13.5px] font-bold text-gain">+15.80%</div>
              </div>
            </div>
          </div>
          <div className={ui.ccard}>
            <div className="mb-2.5 flex items-center gap-2">
              <CoinIcon symbol="BTC" />
              <div>
                <div className="text-[10.5px] font-semibold text-[#5c5c66]">BTC/USD</div>
                <div className="text-[13.5px] font-bold">Bitcoin</div>
              </div>
            </div>
            <div className="border-l-2 border-[#f7931a] pl-1.5 text-[11px] text-[#5c5c66]">Price</div>
            <div className="mt-2 text-[16.5px] font-extrabold">$109,687.60</div>
            <div className="mt-1 text-[11.5px] font-bold text-gain">+3.42%</div>
          </div>
          <div className={ui.ccard}>
            <div className="mb-2.5 flex items-center gap-2">
              <CoinIcon symbol="ETH" />
              <div>
                <div className="text-[10.5px] font-semibold text-[#5c5c66]">ETH/USD</div>
                <div className="text-[13.5px] font-bold">Ethereum</div>
              </div>
            </div>
            <div className="border-l-2 border-[#627eea] pl-1.5 text-[11px] text-[#5c5c66]">Price</div>
            <div className="mt-2 text-[16.5px] font-extrabold">$2,536.20</div>
            <div className="mt-1 text-[11.5px] font-bold text-gain">+2.17%</div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto grid max-w-[1120px] gap-3.5 px-7 py-16 md:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className={cn(ui.card, 'p-[22px]')}>
            <div className={cn(ui.cardIcon, 'mb-3.5')}>
              <f.icon size={17} />
            </div>
            <h3 className="mb-1.5 text-base font-bold">{f.title}</h3>
            <p className="text-[13px] leading-relaxed text-[#9a9aa3]">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 border-t border-[#232329] px-7 py-8 text-xs text-[#5c5c66]">
        <span className="inline-flex items-center gap-2 text-[#f5f5f7]">
          <BrandLogo size={18} /> Piramid
        </span>
        <span>Self-custody · React · FastAPI</span>
      </footer>
    </div>
  )
}
