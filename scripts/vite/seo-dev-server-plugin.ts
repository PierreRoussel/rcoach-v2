import type { Plugin } from 'vite'

import { buildSitemapXml } from '../lib/seo-deploy.mjs'

export function seoDevServerPlugin(): Plugin {
  return {
    name: 'rcoach-seo-dev-server',
    configureServer(server) {
      server.middlewares.use('/sitemap.xml', (_request, response) => {
        const siteUrl =
          process.env.VITE_LEGAL_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:5173'
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/xml; charset=utf-8')
        response.end(buildSitemapXml(siteUrl))
      })
    },
  }
}
