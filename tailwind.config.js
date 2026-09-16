/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,hta}",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0067b8",
          dark: "#004e8c",
          light: "#e0f0ff"
        },
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f5f5f5",
          tertiary: "#fbfbfb"
        },
        status: {
          available: "#107c41",
          inuse: "#0067b8",
          repair: "#ffaa00",
          retired: "#d13438"
        }
      }
    }
  },
  plugins: []
};
