/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        card: '#111111',
        border: '#222222',
        accent: '#2C3E66',
        primary: '#FFFFFF',
        secondary: '#AAAAAA',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
