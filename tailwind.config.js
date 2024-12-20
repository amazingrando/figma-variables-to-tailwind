/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backgroundSize: {
        '50%': '50%',
      },
      colors: {
        dark: '#1C1924',
        magenta: '#F808B5',
        pre: {
          DEFAULT: '#E8F2E6',
          dark: '#D0D9CE',
        },
      },
      fontFamily: {
        sans: ['League Gothic', 'sans-serif'],
      },
      keyframes: {
        'fade-in-out': {
          '0%': { opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { opacity: '0' },
        }
      },
      animation: {
        'fade-in-out': 'fade-in-out 3s ease-in-out'
      }
    },
  },
  plugins: [],
  darkMode: ['class', '.figma-dark']
}
