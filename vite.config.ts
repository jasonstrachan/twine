import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true, // Better file watching
    },
  },
  optimizeDeps: {
    force: true, // Force re-optimization on every server start
  },
  build: {
    sourcemap: true,
  },
  clearScreen: true, // Clear console on every update
})
