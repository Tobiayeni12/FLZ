/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        driftDots: {
          '0%':   { backgroundPosition: '0px 0px' },
          '25%':  { backgroundPosition: '40px 20px' },
          '50%':  { backgroundPosition: '80px 0px' },
          '75%':  { backgroundPosition: '40px -20px' },
          '100%': { backgroundPosition: '0px 0px' },
        },
      },
      animation: {
        driftDots: 'driftDots 30s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
