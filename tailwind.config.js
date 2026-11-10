/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080b12',
          surface: '#0f1624',
          card: '#141c2e',
          cardHover: '#1a243a',
          border: '#23304a',
          primary: '#6366f1',
          accent: '#06b6d4',
          neon: '#38bdf8',
          glow: '#818cf8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Fira Code"', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sound-wave': 'sound-wave 1.2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.03)' },
        },
        'sound-wave': {
          '0%': { height: '6px' },
          '100%': { height: '24px' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

