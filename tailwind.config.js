minMawWidthHeightValues = {
  "200": "50rem",
  "62.5": "15.625rem",
};

module.exports = {
  mode: 'jit',
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./src/components/**/*.{js,ts,jsx,tsx}','./src/layouts/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'transparent': "transparent",
        'trefle-fake-white': "#FAFAFA",
        'trefle-soft-black': "#282828",
        'trefle-green': "#8CBF86",
        'trefle-hover-green': "#A3CC9E",
        'trefle-light-green': "#D4EADE",
        'trefle-ulight-green': "#EFF5F2",
        'trefle-blue': "#4EB0B0",
        'trefle-hover-blue': "#71C0C0",
        'trefle-ulight-blue': "#ECF3F3",
      },
      spacing: {
        "9/10": "90%",
      },
      borderRadius: {
        "4": "1rem",
        "3": ".75rem",
        "2": ".5rem",
        "1": ".25rem",
      },
      minWidth: {...minMawWidthHeightValues},
      maxWidth: {...minMawWidthHeightValues},
      minHeight: {...minMawWidthHeightValues},
      maxHeight: {...minMawWidthHeightValues},
      dropShadow: {
        "base": "0 0 1rem rgba(0, 0, 0, 0.25)",
        "nav": "0 0 .25rem rgba(0, 0, 0, 0.15)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
