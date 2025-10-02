import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you use a different repo name on GitHub, update the base below to '/<your-repo-name>/'
export default defineConfig({
  plugins: [react()],
  base: '/pbi-arrivals/'
})
