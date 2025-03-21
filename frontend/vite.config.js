import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import imageOptimizer from 'vite-plugin-image-optimizer'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  imageOptimizer({})
  ],
})
