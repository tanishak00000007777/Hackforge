import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/studio/",
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 4175,
    strictPort: true,
    open: false,
    // AI editing backend (AI/personaforge). Same-origin in dev, so previews,
    // downloads and iframes work without CORS. Override host with AI_API_URL.
    proxy: {
      "/api": {
        target: process.env.AI_API_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
