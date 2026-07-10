import { Pill } from '@/design-system'
import type { MarketingFeatureTier } from '@/content/marketing/features-catalog'
import { cn } from '@/lib/utils'

type MarketingSectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: MarketingSectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="font-data text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function FeatureTierPill({ tier }: { tier: MarketingFeatureTier }) {
  return (
    <Pill tone={tier === 'premium' ? 'solid-purple' : 'secondary'} className="text-[10px]">
      {tier === 'premium' ? 'Premium' : 'Gratuit'}
    </Pill>
  )
}
