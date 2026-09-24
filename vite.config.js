import { defineConfig } from 'vite'

// En GitHub Pages el sitio vive en /<repo>/; en local y con dominio propio, en /
export default defineConfig({
  base: process.env.BASE_PATH || '/',
})
