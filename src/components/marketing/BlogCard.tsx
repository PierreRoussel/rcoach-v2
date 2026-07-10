import { Link } from '@tanstack/react-router'

import { Pill } from '@/design-system'
import type { BlogPostSummary } from '@/lib/seo/blog'
import { formatBlogDate, getBlogCategoryLabel } from '@/lib/seo/blog'

type BlogCardProps = {
  post: BlogPostSummary
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="secondary" className="text-[10px]">
          {getBlogCategoryLabel(post.category)}
        </Pill>
        <time className="text-xs text-muted-foreground" dateTime={post.publishedAt}>
          {formatBlogDate(post.publishedAt)}
        </time>
      </div>
      <h3 className="mt-3 font-display text-xl font-black leading-tight">
        <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Lire l’article
      </Link>
    </article>
  )
}
