/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',
        surface: '#FFFFFF',
        canvas: '#F4F2EE',
        accent: {
          DEFAULT: '#B8873F',
          soft: '#F5EDDF',
          deep: '#8C6A34',
          ring: 'rgba(184,135,63,0.35)',
        },
        edge: '#E8E7E3',
        'edge-hover': '#DEDCD6',
        line: '#EFEEEA',
        muted: '#6B6B70',
        faint: '#A1A1A6',
        success: '#1E9E5A',
        danger: '#D93A2B',
        info: '#2563EB',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        field: '8px',
        card: '8px',
        modal: '16px',
        pill: '999px',
      },
      boxShadow: {
        xs: '0 0 0 1px rgba(0,0,0,0.02), 0 1px 1px rgba(0,0,0,0.02)',
        sm: '0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.05)',
        lg: '0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        xl: '0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)',

        card: '0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06)',
        'card-lg': '0 0 0 1px rgba(0,0,0,0.03), 0 4px 10px rgba(0,0,0,0.05)',
        'card-lg-hover': '0 0 0 1px rgba(0,0,0,0.06), 0 8px 18px rgba(0,0,0,0.08)',

        float: '0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
        'float-hover': '0 0 0 1px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06)',
        'float-lg': '0 0 0 1px rgba(0,0,0,0.03), 0 4px 10px rgba(0,0,0,0.05)',
        'float-lg-hover': '0 0 0 1px rgba(0,0,0,0.06), 0 8px 18px rgba(0,0,0,0.08)',

        focus: '0 0 0 4px rgba(184,135,63,0.18)',
        'focus-ink': '0 0 0 4px rgba(10,10,11,0.10)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(.4,0,.2,1)',
        'scale-in': 'scale-in 220ms cubic-bezier(.4,0,.2,1)',
        'sheet-up': 'sheet-up 320ms cubic-bezier(.32,.72,0,1)',
        'slide-up': 'slide-up 260ms cubic-bezier(.4,0,.2,1)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}