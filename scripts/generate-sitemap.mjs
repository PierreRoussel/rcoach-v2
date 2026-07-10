import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildCloudflareRoutesJson, buildSitemapXml } from './lib/seo-deploy.mjs'
import { listPublicPrerenderPaths } from './lib/public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const siteUrl = (process.env.VITE_LEGAL_BASE_URL ?? 'https://rcoach.fr').replace(/\/$/, '')

fs.mkdirSync(distDir, { recursive: true })

const sitemap = buildSitemapXml(siteUrl)
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')

const routesJson = buildCloudflareRoutesJson()
fs.writeFileSync(path.join(distDir, '_routes.json'), `${JSON.stringify(routesJson, null, 2)}\n`, 'utf8')

const urlCount = listPublicPrerenderPaths().length
console.log(`Wrote sitemap with ${urlCount} URLs to dist/sitemap.xml`)
console.log(`Wrote Cloudflare _routes.json with ${routesJson.exclude.length} static excludes`)
