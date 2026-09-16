import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import path from "path";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [
    legacy({
      targets: ["ie >= 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"]
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
