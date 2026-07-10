import {
  MARKETING_CATEGORY_DESCRIPTIONS,
  MARKETING_CATEGORY_LABELS,
  type CatalogFeature,
  type MarketingFeatureCategory,
} from '@/content/marketing/features-catalog'
import { FeatureDetailCard } from '@/components/marketing/FeatureDetailCard'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { cn } from '@/lib/utils'

type FeatureCategorySectionProps = {
  category: MarketingFeatureCategory
  features: CatalogFeature[]
  className?: string
  variant?: 'default' | 'compact'
}

export function FeatureCategorySection({
  category,
  features,
  className,
  variant = 'default',
}: FeatureCategorySectionProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <section className={cn('mx-auto max-w-6xl px-4 py-12', className)}>
      <MarketingSectionHeader
        eyebrow={MARKETING_CATEGORY_LABELS[category]}
        title={`Tout sur ${MARKETING_CATEGORY_LABELS[category].toLowerCase()}`}
        description={MARKETING_CATEGORY_DESCRIPTIONS[category]}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureDetailCard key={feature.id} feature={feature} variant={variant} />
        ))}
      </div>
    </section>
  )
}
