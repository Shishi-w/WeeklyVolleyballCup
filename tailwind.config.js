/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 温馨配色方案
        warm: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#ff6b6b',
          600: '#fa5252',
          700: '#f03e3e',
        },
        peach: {
          50: '#fff0f0',
          100: '#ffe5e5',
          200: '#ffd1d1',
          300: '#ffb3b3',
          400: '#ff8f8f',
          500: '#ff7676',
        },
        cream: {
          50: '#fffef9',
          100: '#fefce8',
          200: '#fef9c3',
          300: '#fef08a',
        },
        softBlue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        lavender: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(255, 107, 107, 0.1)',
        'soft-lg': '0 10px 40px -4px rgba(255, 107, 107, 0.15)',
        'warm': '0 4px 20px rgba(255, 182, 193, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'gentle-fade': 'gentleFade 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gentleFade: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}