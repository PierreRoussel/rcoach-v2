import { Dumbbell, Target, UtensilsCrossed } from 'lucide-react'

import { BrandLogo } from '@/design-system/components/brand-logo'
import {
  AUTH_FEATURE_PILLS,
  AUTH_HERO_MOCKUPS,
  AUTH_MARKETING_CONTENT,
  type AuthMarketingVariant,
} from '@/lib/auth/marketing'
import { cn } from '@/lib/utils'

type AuthMarketingHeroProps = {
  variant: AuthMarketingVariant
  className?: string
}

const FEATURE_ICONS = [Dumbbell, UtensilsCrossed, Target] as const

export function AuthMarketingHero({ variant, className }: AuthMarketingHeroProps) {
  const content = AUTH_MARKETING_CONTENT[variant]
  const showMockups = variant !== 'recovery'

  return (
    <div className={cn('relative flex flex-col items-center text-center', className)}>
      <div className="pointer-events-none absolute -left-8 top-8 size-32 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-6 top-20 size-28 rounded-full bg-secondary/20 blur-3xl" />

      <BrandLogo className="relative z-10 mb-4" />

      <p className="relative z-10 font-data text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        {content.eyebrow}
      </p>
      <h1 className="relative z-10 mt-2 max-w-[18rem] font-display text-[1.65rem] leading-tight font-black text-foreground">
        {content.headline}
      </h1>
      <p className="relative z-10 mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {content.description}
      </p>

      {showMockups ? (
        <>
          <div className="relative z-10 mt-5 h-[11.5rem] w-full max-w-[19rem] [contain:layout_style]">
            {AUTH_HERO_MOCKUPS.map((mockup) => (
              <div key={mockup.imageSrc} className={cn(mockup.className, 'auth-mockup-shell')}>
                <div className="auth-mockup-float">
                  <img
                    src={mockup.imageSrc}
                    alt={mockup.alt}
                    decoding="async"
                    className="w-full rounded-2xl border border-white/60 object-cover shadow-lg ring-1 ring-black/5"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2">
            {AUTH_FEATURE_PILLS.map((pill, index) => {
              const Icon = FEATURE_ICONS[index]

              return (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm"
                >
                  <Icon className="size-3.5 text-primary" />
                  {pill.label}
                </span>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
