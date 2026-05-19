import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy API + WebSocket calls to the FastAPI sim backend on port 8000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/state':    'http://localhost:8000',
      '/override': 'http://localhost:8000',
      '/auto':     'http://localhost:8000',
      '/zone':     'http://localhost:8000',
      '/sim':      'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
