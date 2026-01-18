import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      portrait: { raw: '(orientation: portrait)' },
      landscape: { raw: '(orientation: landscape)' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Couleurs principales - Magenta/Violet festif
        primary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // Couleur secondaire - Jaune doré
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Fond sombre - Indigo
        dark: {
          50: '#f8fafc',
          100: '#1e1b4b',
          200: '#312e81',
          300: '#3730a3',
          400: '#4338ca',
          500: '#4f46e5',
          600: '#6366f1',
          700: '#818cf8',
          800: '#a5b4fc',
          900: '#c7d2fe',
        },
        // États
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}

export default config
