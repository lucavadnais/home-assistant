import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Listen on all interfaces so phones/tablets on the LAN can open the app
  server: { host: true },
  preview: { host: true },
})
