minMawWidthHeightValues = {
  "200": "50rem",
};

module.exports = {
  mode: 'jit',
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./src/components/**/*.{js,ts,jsx,tsx}','./src/layouts/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'transparent': "transparent",
        'trefle-green': "#8CBF86",
        'trefle-light-green': "#D4EADE",
        'trefle-soft-black': "#282828",
      },
      spacing: {
        "50": "12.5rem",
        "1/9": "11.111%",
      },
      borderRadius: {
        "4": "1rem",
      },
      minWidth: {...minMawWidthHeightValues},
      maxWidth: {...minMawWidthHeightValues},
      minHeight: {...minMawWidthHeightValues},
      maxHeight: {...minMawWidthHeightValues},
      dropShadow: {
        "base": "0 0 1rem rgba(0, 0, 0, 0.25)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
