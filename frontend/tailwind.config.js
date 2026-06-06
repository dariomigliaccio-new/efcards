/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        night: {
          50:  '#f0ede8',
          100: '#d9d4cc',
          200: '#b8b0a5',
          300: '#968c7e',
          400: '#7a6e62',
          500: '#5e5247',
          600: '#443b32',
          700: '#2a2420',
          800: '#1a1612',
          900: '#0f0c0a',
          950: '#080808',
        },
        gold: {
          50:  '#fdf6e8',
          100: '#f9e9c4',
          200: '#f2d28a',
          300: '#e9b94f',
          400: '#d9a030',
          500: '#c9a96e',
          600: '#b8902b',
          700: '#9a7422',
          800: '#7c5c1b',
          900: '#5e4514',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)',    'system-ui', 'sans-serif'],
      },
      animation: {
        grain:  'grain 8s steps(10) infinite',
        float:  'float 6s ease-in-out infinite',
        glow:   'glow 3s ease-in-out infinite alternate',
        pulse2: 'pulse2 2s ease-in-out infinite',
      },
      keyframes: {
        grain: {
          '0%,100%': { transform: 'translate(0,0)' },
          '10%':     { transform: 'translate(-5%,-10%)' },
          '20%':     { transform: 'translate(-15%,5%)' },
          '30%':     { transform: 'translate(7%,-25%)' },
          '40%':     { transform: 'translate(-5%,25%)' },
          '50%':     { transform: 'translate(-15%,10%)' },
          '60%':     { transform: 'translate(15%,0%)' },
          '70%':     { transform: 'translate(0%,15%)' },
          '80%':     { transform: 'translate(3%,35%)' },
          '90%':     { transform: 'translate(-10%,10%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(-1deg)' },
          '50%':     { transform: 'translateY(-18px) rotate(1deg)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 20px rgba(201,169,110,0.1)' },
          '100%': { boxShadow: '0 0 60px rgba(201,169,110,0.4)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
