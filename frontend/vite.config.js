import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      '.sandbox.novita.ai',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        // 로컬 개발 시 worker를 `cd worker && npm run dev`로 띄우면 8787에서 동작.
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
