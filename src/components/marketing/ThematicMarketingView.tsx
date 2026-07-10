import type { MarketingPageContent } from '@/content/marketing/pages'
import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { FeatureDetailCard } from '@/components/marketing/FeatureDetailCard'
import { FeatureSpotlightSection } from '@/components/marketing/FeatureSpotlightSection'
import { FreePremiumOverview } from '@/components/marketing/FreePremiumOverview'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { getFeaturesByIds } from '@/content/marketing/features-catalog'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'

type ThematicMarketingViewProps = {
  page: MarketingPageContent
  primaryFeatureIds: readonly string[]
  premiumFeatureIds?: readonly string[]
  premiumSectionTitle?: string
  premiumSectionDescription?: string
  primarySectionTitle?: string
  primarySectionDescription?: string
  showFreePremium?: boolean
  heroVariant?: 'centered' | 'split'
}

export function ThematicMarketingView({
  page,
  primaryFeatureIds,
  premiumFeatureIds = [],
  premiumSectionTitle = 'Fonctionnalités Premium associées',
  premiumSectionDescription = 'Levez les limites et accédez à l’accompagnement avancé sur ce volet.',
  primarySectionTitle,
  primarySectionDescription,
  showFreePremium = true,
  heroVariant = 'split',
}: ThematicMarketingViewProps) {
  const premiumFeatures = getFeaturesByIds([...premiumFeatureIds])
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
        variant={heroVariant}
        eyebrow={page.eyebrow}
        headline={page.headline}
        description={page.description}
        ctaLabel={page.ctaLabel ?? 'Démarrer gratuitement'}
        secondaryCtaLabel="Voir toutes les fonctionnalités"
        secondaryCtaTo="/fonctionnalites"
        showMockups={heroVariant === 'split'}
      />

      <FeatureSpotlightSection
        eyebrow="Fonctionnalités clés"
        title={primarySectionTitle ?? 'Ce que vous pouvez faire avec RCoach'}
        description={
          primarySectionDescription ??
          'Des outils concrets pour structurer, mesurer et améliorer votre pratique.'
        }
        featureIds={primaryFeatureIds}
        linkTo="/fonctionnalites"
        linkLabel="Catalogue complet"
      />

      {premiumFeatures.length > 0 ? (
        <section className="bg-muted/20 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <MarketingSectionHeader
              eyebrow="Premium"
              title={premiumSectionTitle}
              description={premiumSectionDescription}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {premiumFeatures.map((feature) => (
                <FeatureDetailCard key={feature.id} feature={feature} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showFreePremium ? <FreePremiumOverview showCta /> : null}

      {page.faq?.length ? <MarketingFaq items={page.faq} /> : null}

      <MarketingCta />
    </>
  )
}
