import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/apple-touch-icon.png", "offline.html"],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB - Tăng lên để cache file lớn
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache navigation requests (HTML pages)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
          {
            // Cache API responses với TTL ngắn
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Cache images
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "XANH AG Admin - Hệ Thống Quản Lý Nông Nghiệp",
        short_name: "Xanh AG v5",
        description: "Hệ thống quản lý nông nghiệp thông minh",
        theme_color: "#059669",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/?pwa=v5",
        start_url: "/?pwa=v5",
        version: "5.0.0", // Tăng version để force update icon
        icons: [
          // Icon 'any' - hiển thị bình thường
          {
            src: '/icons/pwa-icon-192-v5.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/pwa-icon-512-v5.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          // Icon 'maskable' - cho phép OS crop (có safe zone)
          {
            src: '/icons/pwa-maskable-192-v5.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/pwa-maskable-512-v5.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        gcm_sender_id: "103953800507"
      },
      workbox: {
        cleanupOutdatedCaches: true, // Tự động xóa cache cũ
        skipWaiting: true, // Kích hoạt service worker mới ngay lập tức
        clientsClaim: true, // Kiểm soát tất cả clients ngay lập tức
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30MB (cho phép cache file WASM lớn)
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
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
  build: {
    chunkSizeWarningLimit: 10000, // 10MB - Tăng giới hạn warning cho chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor chunks để giảm kích thước file chính
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd'],
          'chart-vendor': ['recharts'],
        }
      }
    }
  }
})
