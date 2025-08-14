import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disable babel for large files to prevent crashes
      babel: {
        parserOpts: {
          plugins: ['jsx', 'importMeta', 'topLevelAwait']
        },
        compact: false,
      },
    })
  ],
  server: {
    hmr: {
      overlay: false, // Disable overlay to prevent crashes
      protocol: 'ws',
      host: 'localhost',
      timeout: 60000, // Increase timeout
    },
    watch: {
      usePolling: false, // Disable polling to reduce CPU usage
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.vite-tmp/**'],
      interval: 1000, // Check every second
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      },
    },
    fs: {
      strict: false,
    },
    // Force browser to always fetch latest
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  },
  optimizeDeps: {
    force: false, // Don't force re-optimization to prevent crashes
    include: ['react', 'react-dom', 'pixi.js', '@pixi/react', 'zustand'], // Pre-bundle heavy deps
    exclude: [], // Ensure all deps are optimized
    esbuildOptions: {
      target: 'es2020',
      keepNames: true,
    },
  },
  cacheDir: '.vite-tmp', // Use temp cache that can be easily cleared
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pixi-vendor': ['pixi.js', '@pixi/react', 'pixi-viewport'],
        },
      },
    },
  },
  clearScreen: false, // Don't clear console to preserve error messages
  esbuild: {
    logLimit: 10, // Limit esbuild log spam
  },
})
