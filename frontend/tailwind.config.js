/** @type {import('tailwindcss').Config} */
// ── NSE "Mission Control" — Ink + Warm Slate ────────────────────────────────
// Restrained, expensive, near-monochrome. Color is used as *signal*, never as
// decoration. No neon, no heavy glows. Neutrals carry ~90% of every screen.
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — Dusty Blue (intelligence · trust). Desaturated.
        brand: {
          50:  '#eef1f6',
          100: '#dde3ed',
          200: '#bcc7da',
          300: '#9dabc4',
          400: '#8497b5',
          500: '#6e86b8',
          600: '#5b7299',
          700: '#4c5f80',
          800: '#3c4b66',
          900: '#2c374d',
        },
        // Live data / signals — muted Steel (kept distinct but quiet)
        cyan: {
          300: '#a6b6c4',
          400: '#8ea0b0',
          500: '#7c93a8',
          600: '#667a8c',
          700: '#52646f',
        },
        // AI / innovation — Dusty Lavender-grey (very low saturation)
        violet: {
          300: '#b3acc6',
          400: '#9f97b6',
          500: '#8f86a8',
          600: '#756d8f',
          700: '#5e5774',
        },
        // Rare highlight — Antique Gold (premium · founder · exceptional only)
        gold: {
          300: '#d6c389',
          400: '#bfa059',
          500: '#a8893f',
        },
        // Ink + warm-slate backgrounds
        base:    '#0C0E13',
        surface: {
          0: '#0C0E13',
          1: '#15171E',
          2: '#1C1F28',
          3: '#232733',
          4: '#2C313D',
        },
        // Status — desaturated, earthen
        success: '#6FA08A', // verified · growing — sage
        warning: '#C2925A', // emerging — muted amber
        danger:  '#B47A66', // declining · risk — terracotta

        // ── Legacy aliases (keep older pages rendering) ─────────────────────
        accent: { 400: '#bfa059', 500: '#a8893f' },
        'neon-green': '#6FA08A',
        'neon-blue':  '#7c93a8',
        'neon-violet':'#8f86a8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Soft, neutral elevation — no colored glows.
        'panel':       '0 1px 2px rgba(0,0,0,0.40), 0 10px 30px rgba(0,0,0,0.30)',
        'card':        '0 1px 2px rgba(0,0,0,0.35), 0 6px 22px rgba(0,0,0,0.22)',
        // "glow" utilities kept for compatibility but reduced to a hairline ring.
        'glow-brand':  'inset 0 0 0 1px rgba(110,134,184,0.22)',
        'glow-cyan':   'inset 0 0 0 1px rgba(124,147,168,0.22)',
        'glow-violet': 'inset 0 0 0 1px rgba(143,134,168,0.22)',
        'glow-gold':   'inset 0 0 0 1px rgba(191,160,89,0.30)',
        'glow-success':'inset 0 0 0 1px rgba(111,160,138,0.25)',
        'brand-sm':    'inset 0 0 0 1px rgba(110,134,184,0.25)',
      },
      keyframes: {
        floaty:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        breathe:   { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        ticker:    { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        driftSlow: { '0%,100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(1.5%,-1%,0)' } },
      },
      animation: {
        floaty:    'floaty 7s ease-in-out infinite',
        breathe:   'breathe 4.5s ease-in-out infinite',
        shimmer:   'shimmer 6s linear infinite',
        ticker:    'ticker 48s linear infinite',
        driftSlow: 'driftSlow 40s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
