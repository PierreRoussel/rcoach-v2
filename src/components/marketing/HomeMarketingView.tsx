import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { HomeValueProps } from '@/components/marketing/HomeValueProps'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { HOME_PAGE } from '@/content/marketing/pages'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'

export function HomeMarketingView() {
  const page = HOME_PAGE
  const jsonLd = [
    softwareApplicationJsonLd(),
    organizationJsonLd(),
    ...(page.faq?.length ? [faqPageJsonLd(page.faq)] : []),
  ]

  return (
    <>
      <PageMeta title={page.title} description={page.metaDescription} path={page.path} />
      <JsonLdScript data={jsonLd} />

      <MarketingHero
        variant="centered"
        badge={page.badge}
        headline={page.headline}
        headlineHighlight={page.headlineHighlight}
        headlineAfter={page.headlineAfter}
        description={page.description}
        ctaLabel={page.ctaLabel ?? 'Démarrer gratuitement'}
        ctaTo="/auth/register"
        secondaryCtaLabel="Voir la démo"
        secondaryCtaTo="/fonctionnalites"
      />

      <HomeValueProps />

      {page.features?.length ? (
        <FeatureGrid features={page.features} title="Tout ce qu’il vous faut" />
      ) : null}

      {page.faq?.length ? <MarketingFaq items={page.faq} id="faq" /> : null}

      <MarketingCta />
    </>
  )
}
