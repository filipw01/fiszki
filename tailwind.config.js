/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: 'hsla(217, 82%, 55%, 1)',
        'dark-gray': 'hsla(0, 0%, 68%, 1)',
        gray: 'hsla(0, 0%, 89%, 1)',
        black: 'hsla(0, 0%, 24%, 1)',
      },
    },
  },
  plugins: [],
}
