/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors used in the card
        dark: {
          900: "#0E0E10",
          800: "#1d1c20",
          700: "#323238",
        },
      },
    },
  },
  plugins: [],
};
