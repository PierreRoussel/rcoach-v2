import { Helmet } from 'react-helmet-async'

import { SITE_DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site'

type PageMetaProps = {
  title: string
  description: string
  path: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noIndex?: boolean
}

export function PageMeta({
  title,
  description,
  path,
  ogImage = SITE_DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: PageMetaProps) {
  const canonical = absoluteUrl(path)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
  const imageUrl = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage)

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  )
}
