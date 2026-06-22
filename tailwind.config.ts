import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Forged-carbon near-black ramp (never pure #000)
        ink: {
          DEFAULT: '#0A0B0C',
          900: '#0A0B0C',
          800: '#101214',
          700: '#16191C',
          600: '#1E2226',
          500: '#2A2F34',
        },
        // Vintage-lume patina cream — the warm tone old tritium ages into
        bone: {
          DEFAULT: '#E8E2D3',
          muted: '#A8A290', // ~4.6:1 on ink (body copy, AA)
          faint: '#79746A', // decorative / large text only
        },
        // Malachite — the RUZZA watch signature
        malachite: {
          DEFAULT: '#1C7A5A',
          deep: '#0E4A37',
          bright: '#2FB089',
          glow: '#3BD4A4',
        },
        // Rose-gold rotor accent — used very sparingly (prices, hairlines)
        champagne: {
          DEFAULT: '#C2A56F',
          deep: '#9C824F',
        },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        label: '0.28em',
        wide: '0.18em',
      },
      maxWidth: {
        editorial: '1440px',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
