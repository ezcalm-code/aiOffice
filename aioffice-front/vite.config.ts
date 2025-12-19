import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1')
      },
      '/ws': {
        target: 'ws://localhost:9001',
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            // 从 URL 参数中获取 token 并添加到 websocket header
            const url = new URL(req.url || '', `http://${req.headers.host}`)
            const token = url.searchParams.get('token')
            if (token) {
              proxyReq.setHeader('websocket', token)
            }
          })
        }
      }
    }
  }
})
