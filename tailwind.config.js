/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.35rem' }],
        sm: ['0.96875rem', { lineHeight: '1.475rem' }],
        base: ['1.0625rem', { lineHeight: '1.6rem' }],
        lg: ['1.2rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.1rem' }],
        '3xl': ['2rem', { lineHeight: '2.45rem' }],
      },
      colors: {
        brand: {
          50: '#EFF6FE',
          100: '#DCEBFE',
          200: '#BBD6FC',
          300: '#8AB9FA',
          500: '#3B82F6',
          600: '#2A70ED',
          700: '#225DCF',
          800: '#1D4BB0',
          900: '#193368',
        },
        primary: {
          50: '#EFF6FE',
          100: '#DCEBFE',
          200: '#BBD6FC',
          300: '#8AB9FA',
          500: '#3B82F6',
          600: '#2A70ED',
          700: '#225DCF',
          800: '#1D4BB0',
          900: '#193368',
        },
        navy: {
          50: '#EEF3FA',
          100: '#DAE5F5',
          200: '#B5CBEB',
          600: '#244A8F',
          700: '#1E3E7A',
          800: '#193368',
          900: '#132752',
          950: '#0C1A38',
        },
        crimson: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#E71818',
          600: '#D11515',
          700: '#B31212',
        },
        surface: {
          canvas: '#F3F6FA',
          card: '#FFFFFF',
          subtle: '#EDF2F7',
          border: '#E4EAF1',
          'border-strong': '#CBD5E1',
        },
        ink: {
          primary: '#0F1C36',
          secondary: '#3B4B64',
          muted: '#66758C',
        },
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(25, 51, 104, 0.05), 0 1px 3px 0 rgba(15, 28, 54, 0.03)',
        'card-hover': '0 10px 28px -6px rgba(25, 51, 104, 0.10), 0 2px 6px -1px rgba(15, 28, 54, 0.04)',
        glass: '0 8px 32px -8px rgba(25, 51, 104, 0.08)',
      },
    },
  },
  plugins: [],
};
