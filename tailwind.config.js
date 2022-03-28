module.exports = {
  mode: 'jit',
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extends: {},
      colors: {
        'transparent': "transparent",
        'trefle-green': "#8CBF86",
        'trefle-light-green': "#D4EADE",
        'trefle-soft-black': "#282828",
      }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}