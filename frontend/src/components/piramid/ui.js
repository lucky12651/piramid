/** Tailwind design tokens for Piramid. Surfaces follow CSS vars in piramid.css. */
export const ui = {
  shell:
    'piramid-shell grid min-h-screen grid-cols-1 text-[14px] antialiased lg:grid-cols-[256px_1fr]',
  sidebar:
    'sticky top-0 z-40 hidden h-screen flex-col border-r border-[var(--line)] bg-[var(--sidebar-bg)] px-4 pb-4 pt-[22px] lg:flex',
  logo: 'mb-[26px] flex items-center gap-2.5 px-1.5 text-[var(--text)]',
  logoText: 'text-[19px] font-extrabold tracking-tight',
  logoSub: 'text-[10.5px] font-medium text-[var(--text-dimmer)]',
  nav: 'mb-[22px] flex flex-col gap-0.5',
  navItem:
    'relative flex w-full items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text-dim)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0',
  navOn:
    'bg-[var(--hover)] text-[var(--text)] after:absolute after:right-0 after:top-1/2 after:h-[18px] after:w-[3px] after:-translate-y-1/2 after:rounded after:bg-[#d7f24c] after:shadow-[0_0_10px_#d7f24c]',
  wlHead: 'mb-2.5 flex items-center justify-between px-3 text-[11px] font-bold tracking-[0.06em] text-[var(--text-dimmer)]',
  wlItem:
    'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition hover:bg-[var(--hover)]',
  main: 'flex min-h-screen min-w-0 flex-col bg-[radial-gradient(ellipse_52%_34%_at_78%_0%,rgba(215,242,76,0.14),transparent_65%)] light:bg-[radial-gradient(ellipse_48%_28%_at_78%_0%,rgba(215,242,76,0.06),transparent_65%)]',
  topbar:
    'sticky top-0 z-30 flex items-center gap-[18px] border-b border-[var(--line)] bg-[var(--sidebar-bg)] px-7 py-5 backdrop-blur-xl max-[860px]:flex-wrap max-[860px]:gap-2.5 max-[860px]:px-4 max-[860px]:py-3.5',
  avatar: 'h-[38px] w-[38px] shrink-0 rounded-full object-cover shadow-[0_0_0_2px_rgba(215,242,76,0.22)]',
  deposit:
    'p-sheen inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] px-[18px] py-2.5 text-[13.5px] font-bold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_18px_rgba(215,242,76,0.32),0_0_28px_rgba(215,242,76,0.2)] [&>svg]:h-[15px] [&>svg]:w-[15px]',
  iconBtn:
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] light:bg-[var(--muted-bg)]',
  search:
    'flex w-[200px] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-2 text-[var(--text-dimmer)] light:bg-[var(--muted-bg)] max-[860px]:w-[140px]',
  pop: 'absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[380px] w-[320px] overflow-auto rounded-[14px] border border-[var(--line)] bg-[var(--sidebar-bg)] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] light:bg-white',
  card: 'p-glass rounded-[18px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-card backdrop-blur-[18px] light:shadow-card-light',
  cardIcon:
    'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#d7f24c] text-[#12160f] shadow-[0_0_16px_rgba(215,242,76,0.28)] light:shadow-[0_0_10px_rgba(215,242,76,0.18)] [&>svg]:h-[17px] [&>svg]:w-[17px]',
  expandBtn:
    'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--muted-bg)] text-[var(--text)] [&>svg]:h-[14px] [&>svg]:w-[14px]',
  title: 'text-[13.5px] font-semibold text-[var(--text-dim)]',
  amount: 'text-[32px] font-extrabold tracking-tight text-[var(--text)]',
  limeBtn:
    'p-sheen inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] px-3.5 py-[11px] text-[13px] font-bold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_18px_rgba(215,242,76,0.32)] [&>svg]:h-3.5 [&>svg]:w-3.5',
  ghostBtn:
    'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--muted-bg)] px-3.5 py-[11px] text-[13px] font-bold text-[var(--text)] [&>svg]:h-3.5 [&>svg]:w-3.5',
  page: 'max-w-[1180px] px-7 py-[22px] pb-8 max-[860px]:px-4 max-[860px]:pb-[110px]',
  crumb: 'mb-2.5 flex flex-wrap items-center gap-2 text-[13px] text-[var(--text-dimmer)]',
  pageTitle: 'mb-1 text-[28px] font-extrabold tracking-tight text-[var(--text)] max-[960px]:text-2xl',
  sub: 'mb-1.5 text-[13px] text-[var(--text-dim)]',
  panel: 'p-glass rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-card backdrop-blur-[18px] light:shadow-card-light',
  side: 'p-glass rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-card backdrop-blur-[18px] light:shadow-card-light',
  row: 'mb-5 last:mb-0',
  label: 'mb-2 flex items-center justify-between gap-2 text-[13px] font-semibold text-[var(--text)]',
  input:
    'w-full rounded-lg border border-[var(--line)] bg-[var(--muted-bg)] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-dimmer)]',
  submit:
    'p-sheen mt-2 w-full rounded-lg bg-gradient-to-b from-[#e8ff6a] via-[#d7f24c] to-[#c4de3a] py-3.5 text-[15px] font-extrabold text-[#12160f] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_18px_rgba(215,242,76,0.32)] disabled:opacity-50',
  link: 'text-xs font-bold text-accent light:text-[#6a7a12]',
  tableWrap: 'p-glass overflow-auto rounded-xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-[18px]',
  th: 'whitespace-nowrap border-b border-[var(--line)] px-4 py-3.5 text-left text-xs font-semibold text-[var(--text-dimmer)]',
  td: 'border-b border-[var(--line)] px-4 py-4 text-[13px] text-[var(--text)]',
  coin: 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--muted-bg)] px-3 py-2 text-[13px] font-bold text-[var(--text-dim)]',
  coinOn: 'border-accent bg-[var(--accent-dim)] text-[var(--text)]',
  warn: 'rounded-lg bg-[var(--muted-bg)] px-3.5 py-3 text-[12.5px] leading-relaxed text-[var(--text-dim)]',
  hint: 'text-xs font-medium text-[var(--text-dimmer)]',
  addr: 'break-all rounded-lg bg-[var(--muted-bg)] px-3.5 py-3 font-mono text-[13px] text-[var(--text)]',
  tab: 'mb-[-1px] border-b-2 border-transparent px-[18px] py-3 text-[14px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)]',
  tabOn: 'border-accent text-[var(--text)]',
  menuItem:
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--text-dim)] hover:bg-[var(--hover)] hover:text-[var(--text)]',
  chip: 'flex items-center gap-1 rounded-full bg-[var(--muted-bg)] px-[11px] py-[7px] text-xs font-semibold text-[var(--text-dim)]',
  ccard:
    'p-glass flex min-w-0 cursor-pointer flex-col rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 text-left backdrop-blur-[18px] transition hover:-translate-y-0.5 hover:border-[#d7f24c]/40',
  tool: 'flex h-[30px] w-[30px] items-center justify-center rounded-md text-[var(--text-dimmer)] hover:bg-[var(--hover)] [&>svg]:h-4 [&>svg]:w-4',
  toolOn: 'bg-[var(--accent-dim)] text-accent',
  tb: 'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-[var(--text-dim)] hover:bg-[var(--hover)] [&>svg]:h-4 [&>svg]:w-4',
}
