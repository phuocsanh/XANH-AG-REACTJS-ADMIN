import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Xanh AG Admin",
        short_name: "XanhAG",
        theme_color: "#ffffff",
        icons: [
            {
                src: 'vite.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
            },
            {
                src: 'vite.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
            }
        ],
        gcm_sender_id: "103953800507"
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src", // Cấu hình alias trỏ đến thư mục `src`
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
