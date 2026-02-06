/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#22c55e",
          hover: "#16a34a",
          light: "#4ade80",
        },
        dark: {
          900: "#0a0e17",
          800: "#0f1623",
          700: "#151d2e",
          600: "#1a2438",
          500: "#243049",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
