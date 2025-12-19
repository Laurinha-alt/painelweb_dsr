import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // O ponto e a barra (./) Isso permite que o site funcionasse dentro das subpastas do SharePoint
  base: './', 
})