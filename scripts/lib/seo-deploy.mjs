import { listPublicPrerenderPaths } from './public-routes.mjs'

const STATIC_ASSET_EXCLUDES = [
  '/assets/*',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/icons.svg',
  '/og-share-default.svg',
  '/badges/*',
  '/onboarding/*',
  '/exercise-fallbacks/*',
  '/manifest.webmanifest',
  '/sw.js',
  '/workbox-*.js',
]

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function buildSitemapXml(siteUrl) {
  const baseUrl = siteUrl.replace(/\/$/, '')
  const urls = listPublicPrerenderPaths().map((pathname) => {
    const loc = pathname === '/' ? baseUrl : `${baseUrl}${pathname}`
    const changefreq = pathname.startsWith('/blog/') ? 'monthly' : pathname === '/' ? 'weekly' : 'monthly'
    const priority = pathname === '/' ? '1.0' : pathname.startsWith('/blog') ? '0.7' : '0.8'

    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function prerenderPathExcludes(paths) {
  const excludes = []

  for (const routePath of paths) {
    if (routePath === '/') {
      continue
    }

    excludes.push(routePath)
    if (!routePath.endsWith('/')) {
      excludes.push(`${routePath}/`)
    }
  }

  return excludes
}

export function buildCloudflareRoutesJson() {
  return {
    version: 1,
    include: ['/*'],
    exclude: [
      ...STATIC_ASSET_EXCLUDES,
      ...prerenderPathExcludes(listPublicPrerenderPaths()),
    ],
  }
}
