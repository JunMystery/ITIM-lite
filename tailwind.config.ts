import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./ITIM.hta",
    "./src/**/*.{ts,html}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0067b8",
          dark: "#004e8c",
          light: "#e0f0ff"
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
} satisfies Config;
