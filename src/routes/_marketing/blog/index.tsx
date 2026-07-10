import { createFileRoute } from '@tanstack/react-router'

import { BlogCard } from '@/components/marketing/BlogCard'
import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { BLOG_INDEX_PAGE } from '@/content/marketing/pages'
import { PageMeta } from '@/lib/seo/PageMeta'
import { getBlogPostSummaries } from '@/lib/seo/blog'
import { organizationJsonLd } from '@/lib/seo/json-ld'

export const Route = createFileRoute('/_marketing/blog/')({
  component: BlogIndexPage,
  loader: () => getBlogPostSummaries(),
})

function BlogIndexPage() {
  const posts = Route.useLoaderData()

  return (
    <>
      <PageMeta
        title={BLOG_INDEX_PAGE.title}
        description={BLOG_INDEX_PAGE.metaDescription}
        path={BLOG_INDEX_PAGE.path}
      />
      <JsonLdScript data={organizationJsonLd()} />

      <MarketingHero
        eyebrow={BLOG_INDEX_PAGE.eyebrow}
        headline={BLOG_INDEX_PAGE.headline}
        description={BLOG_INDEX_PAGE.description}
        showMockups={false}
        secondaryCtaLabel=""
      />

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </section>
    </>
  )
}
