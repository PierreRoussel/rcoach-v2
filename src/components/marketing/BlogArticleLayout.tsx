import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'

import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { PageMeta } from '@/lib/seo/PageMeta'
import type { BlogPostSummary } from '@/lib/seo/blog'
import { formatBlogDate, getBlogCategoryLabel } from '@/lib/seo/blog'
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { Pill } from '@/design-system'

type BlogArticleLayoutProps = {
  post: BlogPostSummary
  Content: ComponentType
}

export function BlogArticleLayout({ post, Content }: BlogArticleLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <PageMeta
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        ogImage={post.coverImage}
        ogType="article"
      />
      <JsonLdScript
        data={[
          blogPostingJsonLd(post),
          breadcrumbJsonLd([
            { name: 'Accueil', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
        ← Retour au blog
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="secondary">{getBlogCategoryLabel(post.category)}</Pill>
          <time className="text-sm text-muted-foreground" dateTime={post.publishedAt}>
            {formatBlogDate(post.publishedAt)}
          </time>
        </div>
        <h1 className="mt-4 font-display text-4xl font-black leading-tight">{post.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
      </header>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-black prose-a:text-primary">
        <Content />
      </div>

      {post.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Pill key={tag} tone="secondary" className="text-[10px]">
              #{tag}
            </Pill>
          ))}
        </div>
      ) : null}

      <MarketingCta
        title="Passez à l’action"
        description="Appliquez ces conseils directement dans RCoach : séances, nutrition et suivi en un seul endroit."
      />
    </article>
  )
}
