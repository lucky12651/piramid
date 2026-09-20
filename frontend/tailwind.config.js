/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        accent: '#d7f24c',
        gain: 'var(--green)',
        loss: 'var(--red)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(215,242,76,0.22)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 36px rgba(0,0,0,0.4), 0 0 40px rgba(215,242,76,0.07)',
        'card-light': 'inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 28px rgba(28, 32, 24, 0.1), 0 1px 2px rgba(28, 32, 24, 0.06)',
      },
      keyframes: {
        sheen: {
          '0%, 55%': { transform: 'translateX(-130%)' },
          '75%, 100%': { transform: 'translateX(130%)' },
        },
      },
      animation: {
        sheen: 'sheen 5s ease-in-out infinite',
      },
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('light', '.theme-light &')
    },
  ],
}
