import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],
      manifest: false, // uses your existing public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'document',
          handler: 'NetworkFirst'
        }]
      },
      devOptions: { enabled: true }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
