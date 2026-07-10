import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listPublicPrerenderPaths } from './lib/public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const siteUrl = (process.env.VITE_LEGAL_BASE_URL ?? 'https://rcoach.fr').replace(/\/$/, '')

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const urls = listPublicPrerenderPaths().map((pathname) => {
  const loc = pathname === '/' ? siteUrl : `${siteUrl}${pathname}`
  const changefreq = pathname.startsWith('/blog/') ? 'monthly' : pathname === '/' ? 'weekly' : 'monthly'
  const priority = pathname === '/' ? '1.0' : pathname.startsWith('/blog') ? '0.7' : '0.8'

  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
})

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

fs.mkdirSync(distDir, { recursive: true })
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
console.log(`Wrote sitemap with ${urls.length} URLs to dist/sitemap.xml`)
