/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        navy: {
          700: '#1E3A5F',
          800: '#152A47',
          900: '#0F223D',
          950: '#0A172B',
        },
        surface: {
          canvas: '#F4F6F8',
          card: '#FFFFFF',
          subtle: '#EDF0F4',
          border: '#D8DEE6',
          'border-strong': '#B8C2CE',
        },
        ink: {
          primary: '#0F172A',
          secondary: '#334155',
          muted: '#526071',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '6px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 2px 6px 0 rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
}
