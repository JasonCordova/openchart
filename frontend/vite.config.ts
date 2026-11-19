import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_MAPBOX_TOKEN'],
  server: {
    proxy: {
      '/api': { target: loadEnv(mode, '.', 'API_PROXY_').API_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
}))
