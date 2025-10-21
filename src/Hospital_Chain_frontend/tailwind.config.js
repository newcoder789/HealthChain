/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#86efac',
          500: '#22c55e',
          600: '#16a34a',
        },
        secondary: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        accent: {
          400: '#bbf7d0',
          500: '#86efac',
          600: '#4ade80',
        },
        neon: {
          400: '#fef3c7',
          500: '#fde68a',
          600: '#fcd34d',
        },
      },
    },
  },
  plugins: [],
}

