/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        surface: '#FAF9F5',
        card: '#FFFFFF',
        border: '#E8E6DE',
        terracotta: {
          DEFAULT: '#C96442',
          hover: '#B85638',
          light: '#C96442/10',
        },
        sage: {
          DEFAULT: '#7A8B6F',
          light: '#7A8B6F15',
        },
        sky: {
          DEFAULT: '#5B8FA8',
          light: '#5B8FA815',
        },
        heading: '#1F1E1D',
        secondary: '#6B6B6B',
      },
    },
  },
  plugins: [],
};
