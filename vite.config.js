import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
