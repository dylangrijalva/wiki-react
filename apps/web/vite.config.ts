import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    port: Number(process.env.WEB_PORT ?? 5177),
    strictPort: true,
    proxy: { '/api': process.env.API_ORIGIN ?? 'http://127.0.0.1:3001' },
  },
  test: { environment: 'jsdom' },
})
