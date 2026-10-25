/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#4f46e5', dark: '#4338ca', soft: '#eef2ff' },
        navy: { DEFAULT: '#0f172a', deep: '#0b1220', muted: '#1e293b' },
        accent: '#f59e0b',
        success: '#059669',
        warning: '#d97706',
        danger: '#e11d48',
        info: '#0284c7',
        page: '#f8fafc',
        border: '#e2e8f0',
      },
      boxShadow: { card: '0 1px 2px rgb(15 23 42 / 0.05)' },
      borderRadius: { card: '0.75rem', control: '0.5rem' },
      transitionDuration: { 150: '150ms', 180: '180ms' },
    },
  },
  plugins: [],
};
