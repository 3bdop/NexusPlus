import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/company/jobs/applications': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/api/cv': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/api/job': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
