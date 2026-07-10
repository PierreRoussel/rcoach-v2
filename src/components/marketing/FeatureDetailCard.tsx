import type { CatalogFeature } from '@/content/marketing/features-catalog'
import { FeatureTierPill } from '@/components/marketing/MarketingSectionHeader'
import { cn } from '@/lib/utils'

type FeatureDetailCardProps = {
  feature: CatalogFeature
  variant?: 'default' | 'compact'
  className?: string
}

export function FeatureDetailCard({
  feature,
  variant = 'default',
  className,
}: FeatureDetailCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm',
        variant === 'compact' && 'p-4',
        className,
      )}
    >
      {feature.imageSrc ? (
        <img
          src={feature.imageSrc}
          alt=""
          className="mb-4 h-32 w-full rounded-xl border border-border/60 object-cover object-top"
          loading="lazy"
        />
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <FeatureTierPill tier={feature.tier} />
      </div>

      <h3 className="font-display text-lg font-black leading-tight">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {variant === 'compact' ? feature.description : feature.longDescription}
      </p>

      {feature.bullets.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
