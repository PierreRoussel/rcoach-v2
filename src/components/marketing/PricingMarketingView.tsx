import { JsonLdScript } from '@/components/marketing/JsonLdScript'
import { FeatureDetailCard } from '@/components/marketing/FeatureDetailCard'
import { FreePremiumOverview } from '@/components/marketing/FreePremiumOverview'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { MarketingFaq } from '@/components/marketing/MarketingFaq'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { PricingTable } from '@/components/marketing/PricingTable'
import { SubscriptionCompareTable } from '@/components/subscription/SubscriptionCompareTable'
import { PRICING_PAGE } from '@/content/marketing/pages'
import { PAGE_FEATURE_IDS, getFeaturesByIds } from '@/content/marketing/features-catalog'
import { PageMeta } from '@/lib/seo/PageMeta'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld'

export function PricingMarketingView() {
  const page = PRICING_PAGE
  const premiumFeatures = getFeaturesByIds(PAGE_FEATURE_IDS.premium)
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
        eyebrow={page.eyebrow}
        headline={page.headline}
        description={page.description}
        ctaLabel="Essayer Premium"
        ctaTo="/auth/register"
        secondaryCtaLabel="Rester en gratuit"
        secondaryCtaTo="/auth/register"
        showMockups={false}
      />

      <PricingTable />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <MarketingSectionHeader
          eyebrow="Détail Premium"
          title="Chaque avantage Premium expliqué"
          description="Ne payez que si vous avez besoin de lever les limites et d’accéder à l’accompagnement avancé."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {premiumFeatures.map((feature) => (
            <FeatureDetailCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      <FreePremiumOverview showCta={false} />

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <MarketingSectionHeader
          eyebrow="Comparatif"
          title="Tableau Gratuit vs Premium"
          description="Toutes les limites et déblocages côte à côte."
        />
        <div className="mt-8">
          <SubscriptionCompareTable />
        </div>
      </section>

      {page.faq?.length ? <MarketingFaq items={page.faq} /> : null}

      <MarketingCta
        title="Prêt à tester Premium ?"
        description="Créez votre compte et découvrez l’essai selon l’offre en cours. Vous pouvez commencer gratuitement et upgrader quand vous le souhaitez."
      />
    </>
  )
}
