/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          deep: '#14532D',
          leaf: '#22C55E',
          mint: '#ECFDF5',
          sage: '#F0FDF4',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
        },
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(20, 83, 45, 0.18)',
        lift: '0 12px 32px -14px rgba(20, 83, 45, 0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms ease-out both',
      },
    },
  },
  plugins: [],
};
