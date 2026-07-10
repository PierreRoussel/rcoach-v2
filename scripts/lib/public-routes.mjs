import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const blogDir = path.resolve(__dirname, '../../src/content/blog')

export function listBlogSlugs() {
  if (!fs.existsSync(blogDir)) {
    return []
  }

  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort()
}

export const MARKETING_STATIC_PATHS = [
  '/',
  '/fonctionnalites',
  '/application-musculation',
  '/application-nutrition',
  '/pour-les-coachs',
  '/tarifs',
  '/blog',
  '/help',
  '/about',
  '/legal/privacy',
  '/legal/terms',
  '/legal/cgv',
  '/legal/mentions-legales',
]

export function listPublicPrerenderPaths() {
  const blogPaths = listBlogSlugs().map((slug) => `/blog/${slug}`)
  return [...MARKETING_STATIC_PATHS, ...blogPaths]
}
