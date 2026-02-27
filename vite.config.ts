import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
// ADD: Import for PWA
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // ADD: PWA plugin with minimal config for offline caching
    VitePWA({
      registerType: 'autoUpdate',  // Auto-registers service worker
      includeAssets: ['**/*'],     // Cache all assets for offline
      manifest: false,             // Use your existing public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],  // Cache build outputs
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'document',
          handler: 'NetworkFirst'  // Try network, fallback to cache
        }]
      },
      devOptions: { enabled: true }  // Enable in dev mode for testing
    }),
    viteSingleFile()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});