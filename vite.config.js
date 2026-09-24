import { defineConfig } from 'vite'

// En GitHub Pages el sitio vive en /<repo>/; en local y con dominio propio, en /
const base = process.env.BASE_PATH || '/'
// Dirección pública completa: WhatsApp, Facebook y X necesitan URLs absolutas para la tarjeta
const siteUrl = (process.env.SITE_URL || `https://alexparedesverayahoo.github.io${base}`).replace(/\/?$/, '/')

export default defineConfig({
  base,
  plugins: [
    {
      name: 'site-url',
      transformIndexHtml: html => html.replaceAll('%SITE_URL%', siteUrl),
    },
  ],
})
