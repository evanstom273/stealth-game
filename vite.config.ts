import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    // Phaser alone is about 1.5 MB minified, so Vite's default 500 kB warning would fire on every build.
    chunkSizeWarningLimit: 2000,
  },
})
