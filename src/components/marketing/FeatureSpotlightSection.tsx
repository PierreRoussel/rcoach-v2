import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import {
  getFeaturesByIds,
  type CatalogFeature,
} from '@/content/marketing/features-catalog'
import { FeatureDetailCard } from '@/components/marketing/FeatureDetailCard'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { cn } from '@/lib/utils'

type FeatureSpotlightSectionProps = {
  title: string
  description?: string
  eyebrow?: string
  featureIds: readonly string[]
  linkTo?: string
  linkLabel?: string
  className?: string
}

export function FeatureSpotlightSection({
  title,
  description,
  eyebrow,
  featureIds,
  linkTo,
  linkLabel = 'En savoir plus',
  className,
}: FeatureSpotlightSectionProps) {
  const features = getFeaturesByIds([...featureIds])

  return (
    <section className={cn('mx-auto max-w-6xl px-4 py-12', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <MarketingSectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        {linkTo ? (
          <Link
            to={linkTo}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {linkLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature: CatalogFeature) => (
          <FeatureDetailCard key={feature.id} feature={feature} />
        ))}
      </div>
    </section>
  )
}
