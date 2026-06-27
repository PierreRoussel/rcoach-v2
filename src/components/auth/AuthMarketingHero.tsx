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
  compact?: boolean
}

const FEATURE_ICONS = [Dumbbell, UtensilsCrossed, Target] as const

export function AuthMarketingHero({
  variant,
  className,
  compact = false,
}: AuthMarketingHeroProps) {
  const content = AUTH_MARKETING_CONTENT[variant]
  const showMockups = variant !== 'recovery' && variant !== 'register'

  return (
    <div className={cn('relative flex flex-col items-center text-center', className)}>
      <div className="pointer-events-none absolute -left-8 top-8 size-32 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-6 top-20 size-28 rounded-full bg-secondary/20 blur-3xl" />

      <BrandLogo compact={compact} className={cn('relative z-10', compact ? 'mb-2' : 'mb-4')} />

      <p className="relative z-10 font-data text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        {content.eyebrow}
      </p>
      <h1
        className={cn(
          'relative z-10 mt-1.5 max-w-[18rem] font-display leading-tight font-black text-foreground',
          compact ? 'text-xl' : 'mt-2 text-[1.65rem]',
        )}
      >
        {content.headline}
      </h1>
      <p
        className={cn(
          'relative z-10 max-w-xs text-muted-foreground',
          compact
            ? variant === 'register'
              ? 'mt-0.5 line-clamp-2 text-[11px] leading-snug'
              : 'mt-1 text-xs leading-snug'
            : 'mt-2 text-sm leading-relaxed',
        )}
      >
        {content.description}
      </p>

      {showMockups ? (
        <>
          <div
            className={cn(
              'relative z-10 w-full auth-mockup-stage',
              compact
                ? 'mt-3 h-[7.75rem] max-w-[15rem]'
                : 'mt-5 h-[11.5rem] max-w-[19rem]',
            )}
          >
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

          {!compact ? (
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
          ) : null}
        </>
      ) : null}
    </div>
  )
}
