/** Tailwind design tokens for Piramid. Surfaces follow CSS vars in piramid.css. */
export const ui = {
  shell:
    'piramid-shell grid min-h-screen grid-cols-1 text-[14px] leading-normal antialiased lg:grid-cols-[256px_1fr]',
  sidebar:
    'sticky top-0 z-40 hidden h-screen flex-col border-r border-[var(--line)] bg-[var(--sidebar-bg)] px-4 pb-4 pt-6 lg:flex',
  logo: 'mb-6 flex items-center gap-2.5 px-1.5 text-[var(--text)]',
  logoText: 'text-[18px] font-extrabold tracking-tight',
  logoSub: 'text-[11px] font-medium text-[var(--text-dimmer)]',
  nav: 'mb-6 flex flex-col gap-0.5',
  navItem:
    'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text-dim)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0',
  navOn:
    'bg-[var(--hover)] text-[var(--text)] after:absolute after:right-0 after:top-1/2 after:h-4 after:w-[3px] after:-translate-y-1/2 after:rounded after:bg-accent light:after:shadow-none after:shadow-[0_0_8px_#d7f24c]',
  wlHead: 'mb-2 flex items-center justify-between px-3 text-[11px] font-bold tracking-[0.06em] text-[var(--text-dimmer)]',
  wlItem:
    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--hover)]',
  main: 'flex min-h-screen min-w-0 flex-col bg-[radial-gradient(ellipse_52%_34%_at_78%_0%,rgba(215,242,76,0.12),transparent_65%)] light:bg-[radial-gradient(ellipse_48%_28%_at_78%_0%,rgba(215,242,76,0.05),transparent_65%)]',
  topbar:
    'sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--line)] bg-[var(--sidebar-bg)]/90 px-6 py-4 backdrop-blur-xl max-[860px]:flex-wrap max-[860px]:gap-2 max-[860px]:px-4 max-[860px]:py-3',
  avatar: 'h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-accent/25',
  deposit:
    'p-sheen inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] px-4 text-[13px] font-bold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_12px_rgba(215,242,76,0.28)] light:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_8px_rgba(90,100,20,0.16)] [&>svg]:h-4 [&>svg]:w-4',
  iconBtn:
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] transition hover:bg-[var(--hover)] light:bg-[var(--muted-bg)]',
  search:
    'flex h-10 w-[200px] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[var(--text-dimmer)] light:bg-[var(--muted-bg)] max-[860px]:w-[140px]',
  pop: 'absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[min(380px,70vh)] w-[min(320px,calc(100vw-2rem))] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--sidebar-bg)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] light:bg-white light:shadow-[0_12px_32px_rgba(26,31,22,0.12)]',
  card: 'p-glass overflow-visible rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-card backdrop-blur-[18px] light:shadow-card-light',
  cardIcon:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-[#12160f] [&>svg]:h-4 [&>svg]:w-4 light:shadow-none shadow-[0_0_12px_rgba(215,242,76,0.22)]',
  expandBtn:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted-bg)] text-[var(--text)] transition hover:bg-[var(--hover)] [&>svg]:h-3.5 [&>svg]:w-3.5',
  title: 'text-[13px] font-semibold text-[var(--text-dim)]',
  amount: 'text-[28px] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[32px]',
  limeBtn:
    'p-sheen inline-flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] px-4 text-[13px] font-bold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_12px_rgba(215,242,76,0.28)] light:shadow-[0_2px_8px_rgba(90,100,20,0.16)] [&>svg]:h-3.5 [&>svg]:w-3.5 disabled:opacity-50',
  ghostBtn:
    'inline-flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--muted-bg)] px-4 text-[13px] font-bold text-[var(--text)] transition hover:bg-[var(--hover)] [&>svg]:h-3.5 [&>svg]:w-3.5 disabled:opacity-50',
  page: 'page-shell mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-[860px]:pb-[110px]',
  crumb: 'mb-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--text-dimmer)]',
  pageTitle: 'mb-1 text-[26px] font-extrabold tracking-tight text-[var(--text)] sm:text-[28px]',
  sub: 'mb-6 max-w-3xl text-[13px] leading-relaxed text-[var(--text-dim)]',
  panel:
    'p-glass overflow-visible rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-card backdrop-blur-[18px] sm:p-6 light:shadow-card-light',
  side: 'p-glass overflow-visible rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-card backdrop-blur-[18px] light:shadow-card-light',
  row: 'mb-5 last:mb-0',
  label: 'mb-2 flex items-center justify-between gap-2 text-[13px] font-semibold text-[var(--text)]',
  input:
    'h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--muted-bg)] px-3.5 text-[14px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-dimmer)] focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
  submit:
    'p-sheen mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] text-[14px] font-extrabold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_12px_rgba(215,242,76,0.28)] disabled:opacity-50',
  link: 'text-xs font-bold text-accent hover:underline light:text-[#5c6a10]',
  tableWrap:
    'p-glass overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-[18px]',
  th: 'whitespace-nowrap border-b border-[var(--line)] px-4 py-3 text-left text-xs font-semibold text-[var(--text-dimmer)]',
  td: 'border-b border-[var(--line)] px-4 py-3.5 text-[13px] text-[var(--text)]',
  coin: 'inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--muted-bg)] px-3 text-[13px] font-bold text-[var(--text-dim)] transition hover:bg-[var(--hover)]',
  coinOn: 'border-accent bg-[var(--accent-dim)] text-[var(--text)]',
  warn: 'rounded-xl bg-[var(--muted-bg)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--text-dim)]',
  hint: 'text-xs font-medium text-[var(--text-dimmer)]',
  addr: 'break-all rounded-xl bg-[var(--muted-bg)] px-3.5 py-3 font-mono text-[13px] text-[var(--text)]',
  tab: 'mb-[-1px] border-b-2 border-transparent px-4 py-3 text-[14px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)]',
  tabOn: 'border-accent text-[var(--text)]',
  menuItem:
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--text-dim)] hover:bg-[var(--hover)] hover:text-[var(--text)]',
  chip: 'flex h-8 items-center gap-1 rounded-full bg-[var(--muted-bg)] px-3 text-xs font-semibold text-[var(--text-dim)]',
  ccard:
    'p-glass flex min-w-0 cursor-pointer flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-left transition hover:border-accent/35 hover:bg-[var(--hover)]',
  tool: 'flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-dimmer)] hover:bg-[var(--hover)] [&>svg]:h-4 [&>svg]:w-4',
  toolOn: 'bg-[var(--accent-dim)] text-accent',
  tb: 'flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold text-[var(--text-dim)] hover:bg-[var(--hover)] [&>svg]:h-4 [&>svg]:w-4',
}
