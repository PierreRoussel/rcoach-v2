import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ComponentType } from 'react'

export type BlogCategory = 'nutrition' | 'musculation' | 'coaching' | 'general'

export type BlogPostMeta = {
  title: string
  description: string
  publishedAt: string
  category: BlogCategory
  tags: string[]
  coverImage?: string
}

export type BlogPostModule = {
  default: ComponentType
  meta: BlogPostMeta
}

export type BlogPostSummary = BlogPostMeta & {
  slug: string
}

export type BlogPost = BlogPostSummary & {
  Content: ComponentType
}

const blogModules = import.meta.glob<BlogPostModule>('../../content/blog/*.mdx', {
  eager: true,
})

function slugFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.mdx$/)
  if (!match?.[1]) {
    throw new Error(`Invalid blog path: ${path}`)
  }
  return match[1]
}

export function getAllBlogPosts(): BlogPost[] {
  return Object.entries(blogModules)
    .map(([path, module]) => {
      const slug = slugFromPath(path)
      return {
        slug,
        ...module.meta,
        Content: module.default,
      }
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}

export function getBlogPostSummaries(): BlogPostSummary[] {
  return getAllBlogPosts().map(({ Content: _Content, ...summary }) => summary)
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((post) => post.slug === slug) ?? null
}

export function getBlogSlugs(): string[] {
  return getAllBlogPosts().map((post) => post.slug)
}

export function getBlogCategoryLabel(category: BlogCategory): string {
  switch (category) {
    case 'nutrition':
      return 'Nutrition'
    case 'musculation':
      return 'Musculation'
    case 'coaching':
      return 'Coaching'
    default:
      return 'Général'
  }
}

export function formatBlogDate(isoDate: string): string {
  return format(new Date(isoDate), 'd MMMM yyyy', { locale: fr })
}
