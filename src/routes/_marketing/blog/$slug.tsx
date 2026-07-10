import { createFileRoute, notFound } from '@tanstack/react-router'

import { BlogArticleLayout } from '@/components/marketing/BlogArticleLayout'
import { getBlogPostBySlug } from '@/lib/seo/blog'

export const Route = createFileRoute('/_marketing/blog/$slug')({
  loader: ({ params }) => {
    const post = getBlogPostBySlug(params.slug)
    if (!post) {
      throw notFound()
    }
    return post
  },
  component: BlogArticlePage,
})

function BlogArticlePage() {
  const post = Route.useLoaderData()
  const { Content, ...summary } = post

  return <BlogArticleLayout post={summary} Content={Content} />
}
