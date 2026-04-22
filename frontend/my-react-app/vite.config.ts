import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",  // ← используйте относительные пути
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html",  // ← явно укажите входную точку
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});