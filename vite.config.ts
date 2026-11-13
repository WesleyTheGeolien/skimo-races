import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/skimo-races/ on GitHub Pages
  base: '/skimo-races/',
})
