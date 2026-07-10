import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { FeatureCategorySection } from '@/components/marketing/FeatureCategorySection'
import { FreePremiumOverview } from '@/components/marketing/FreePremiumOverview'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { SubscriptionCompareTable } from '@/components/subscription/SubscriptionCompareTable'
import { FEATURES_PAGE } from '@/content/marketing/pages'
import {
  MARKETING_CATEGORY_ORDER,
  MARKETING_FEATURES_CATALOG,
  getFeaturesByCategory,
} from '@/content/marketing/features-catalog'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'

export function FeaturesMarketingView() {
  const page = FEATURES_PAGE
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
        badge="Catalogue complet"
        headline={page.headline}
        description={page.description}
        ctaLabel="Démarrer gratuitement"
        secondaryCtaLabel="Comparer les tarifs"
        secondaryCtaTo="/tarifs"
        showMockups={false}
      />

      <section className="border-y border-border/60 bg-background py-10">
        <div className="mx-auto max-w-6xl px-4">
          <MarketingSectionHeader
            align="center"
            eyebrow="Vue d’ensemble"
            title={`${MARKETING_FEATURES_CATALOG.length} fonctionnalités pour couvrir tout votre parcours`}
            description="Chaque capacité gratuite ou Premium de RCoach est détaillée ci-dessous, classée par univers."
          />
        </div>
      </section>

      {MARKETING_CATEGORY_ORDER.map((category) => (
        <FeatureCategorySection
          key={category}
          category={category}
          features={getFeaturesByCategory(category)}
        />
      ))}

      <FreePremiumOverview />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <MarketingSectionHeader
          eyebrow="Comparatif"
          title="Gratuit vs Premium en un coup d’œil"
          description="Le tableau détaillé pour choisir la formule adaptée à votre niveau d’engagement."
        />
        <div className="mt-8">
          <SubscriptionCompareTable />
        </div>
      </section>

      {page.faq?.length ? <MarketingFaq items={page.faq} /> : null}

      <MarketingCta />
    </>
  )
}
