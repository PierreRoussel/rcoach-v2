import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { FeatureDetailCard } from '@/components/marketing/FeatureDetailCard'
import { FeatureSpotlightSection } from '@/components/marketing/FeatureSpotlightSection'
import { FreePremiumOverview } from '@/components/marketing/FreePremiumOverview'
import { HomeValueProps } from '@/components/marketing/HomeValueProps'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { HOME_PAGE } from '@/content/marketing/pages'
import { PAGE_FEATURE_IDS, getFeaturesByIds } from '@/content/marketing/features-catalog'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'

export function HomeMarketingView() {
  const page = HOME_PAGE
  const premiumHighlights = getFeaturesByIds(PAGE_FEATURE_IDS.premium.slice(0, 6))
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

      <FeatureSpotlightSection
        eyebrow="Piliers"
        title="Musculation, nutrition et motivation réunis"
        description="Les trois piliers de RCoach pour structurer votre semaine sportive sans multiplier les applications."
        featureIds={PAGE_FEATURE_IDS.home}
        linkTo="/fonctionnalites"
        linkLabel="Explorer toutes les fonctionnalités"
      />

      <section className="bg-muted/20 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <MarketingSectionHeader
            eyebrow="Premium"
            title="Passez à la vitesse supérieure"
            description="Historique illimité, stats avancées, conseils nutrition et coaching dynamique — tout ce qui accélère une progression sérieuse."
            align="center"
            className="mb-8"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {premiumHighlights.map((feature) => (
              <FeatureDetailCard key={feature.id} feature={feature} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <FreePremiumOverview />

      {page.faq?.length ? <MarketingFaq items={page.faq} id="faq" /> : null}

      <MarketingCta />
    </>
  )
}
