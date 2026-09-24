import { defineConfig } from 'vite'

// En GitHub Pages el sitio vive en /<repo>/; en local y con dominio propio, en /
const base = process.env.BASE_PATH || '/'
// Dirección pública completa: WhatsApp, Facebook y X necesitan URLs absolutas para la tarjeta
const siteUrl = (process.env.SITE_URL || `https://alexparedesverayahoo.github.io${base}`).replace(/\/?$/, '/')
// Versión de cada publicación: se agrega a fotos y fotogramas para que ningún navegador muestre una versión vieja
const build = (process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 8)

export default defineConfig({
  base,
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [
    {
      name: 'site-url-y-version',
      transformIndexHtml: html =>
        html
          .replaceAll('%SITE_URL%', siteUrl)
          .replace(/((?:src|href)="[^"]*\/(?:img|film)\/[^"?]+)"/g, `$1?v=${build}"`),
    },
  ],
})
