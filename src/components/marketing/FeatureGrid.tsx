import type { MarketingFeature } from '@/content/marketing/pages'
import { cn } from '@/lib/utils'

type FeatureGridProps = {
  features: MarketingFeature[]
  title?: string
  description?: string
  className?: string
}

export function FeatureGrid({ features, title, description, className }: FeatureGridProps) {
  return (
    <section className={cn('mx-auto max-w-6xl px-4 py-12', className)}>
      {title ? (
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-black">{title}</h2>
          {description ? (
            <p className="mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            {feature.imageSrc ? (
              <img
                src={feature.imageSrc}
                alt=""
                className="mb-4 h-28 w-full rounded-xl border border-border/60 object-cover"
                loading="lazy"
              />
            ) : null}
            <h3 className="font-display text-lg font-black">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
