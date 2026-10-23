/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e2f7f9',
          100: '#d1f4f3',
          200: '#b1f0ee',
          300: '#95dfdd',
          DEFAULT: '#60d1d4',
          500: '#60d1d4',
          600: '#3eb8bb',
          700: '#269194',
          800: '#14595c',
          900: '#062224',
        },
        dark: {
          teal: '#062224',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
