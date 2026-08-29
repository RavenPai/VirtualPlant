/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        moss: {
          50: '#f3f7f0',
          100: '#e4eedc',
          200: '#c9ddb8',
          300: '#9fc085',
          400: '#74a056',
          500: '#56833b',
          600: '#42682d',
          700: '#355226',
          800: '#2d4322',
          900: '#26391e',
        },
        soil: {
          400: '#8b5e3c',
          500: '#6b4226',
          700: '#3d2614',
        },
      },
      boxShadow: {
        plant: '0 18px 50px rgba(35, 55, 24, 0.28)',
      },
    },
  },
  plugins: [],
}
