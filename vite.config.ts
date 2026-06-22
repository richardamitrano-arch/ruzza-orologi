import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split the large product dataset into its own long-cacheable chunk
          // so it's downloaded in parallel and stays cached across app updates.
          if (id.includes('commerce.json')) return 'commerce-data'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
