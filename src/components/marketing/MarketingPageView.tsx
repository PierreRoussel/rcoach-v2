import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'
import type { MarketingPageContent } from '@/content/marketing/pages'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'

type MarketingPageViewProps = {
  page: MarketingPageContent
  showMockups?: boolean
  extraSections?: React.ReactNode
}

export function MarketingPageView({
  page,
  showMockups = false,
  extraSections,
}: MarketingPageViewProps) {
  const jsonLd = [
    softwareApplicationJsonLd(),
    organizationJsonLd(),
    ...(page.faq?.length ? [faqPageJsonLd(page.faq)] : []),
  ]

  return (
    <>
      <PageMeta
        title={page.title}
        description={page.metaDescription}
        path={page.path}
      />
      <JsonLdScript data={jsonLd} />

      <MarketingHero
        eyebrow={page.eyebrow}
        headline={page.headline}
        description={page.description}
        ctaLabel={page.ctaLabel}
        showMockups={showMockups}
      />

      {page.features?.length ? (
        <FeatureGrid
          features={page.features}
          title={page.path === '/' ? 'Tout ce qu’il vous faut' : 'Les points clés'}
        />
      ) : null}

      {extraSections}

      {page.faq?.length ? <MarketingFaq items={page.faq} /> : null}

      <MarketingCta />
    </>
  )
}
