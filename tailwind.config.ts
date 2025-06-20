/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        // Add Hero UI files if needed:
        "./node_modules/@hero-ui/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Your theme customizations here
        },
    },
    plugins: [
        // Any other Tailwind plugins you use:
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
        // Hero UI plugin:
        require("@hero-ui/tailwind-plugin"),
    ],
};
