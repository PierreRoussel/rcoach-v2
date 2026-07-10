import { Link } from '@tanstack/react-router'
import { ArrowRight, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AUTH_HERO_MOCKUPS } from '@/lib/auth/marketing'
import { cn } from '@/lib/utils'

type MarketingHeroProps = {
  badge?: string
  headline: string
  headlineHighlight?: string
  headlineAfter?: string
  description: string
  ctaLabel?: string
  ctaTo?: string
  secondaryCtaLabel?: string
  secondaryCtaTo?: string
  variant?: 'split' | 'centered'
  showMockups?: boolean
  className?: string
}

export function MarketingHero({
  badge,
  headline,
  headlineHighlight,
  headlineAfter,
  description,
  ctaLabel = 'Essayer gratuitement',
  ctaTo = '/auth/register',
  secondaryCtaLabel = 'Voir les fonctionnalités',
  secondaryCtaTo = '/fonctionnalites',
  variant = 'split',
  showMockups = false,
  className,
}: MarketingHeroProps) {
  if (variant === 'centered') {
    return (
      <section className={cn('relative overflow-hidden', className)}>
        <div className="pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-primary/12 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
          {badge ? (
            <p className="inline-flex rounded-full border border-border/80 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              {badge}
            </p>
          ) : null}

          <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] tracking-tight text-foreground md:text-6xl">
            {headlineHighlight ? (
              <>
                {headline}
                <span className="text-primary">{headlineHighlight}</span>
                {headlineAfter}
              </>
            ) : (
              headline
            )}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="pill" size="lg" className="rounded-full px-6" asChild>
              <Link to={ctaTo}>
                <Play className="size-4 fill-current" aria-hidden />
                {ctaLabel}
              </Link>
            </Button>
            {secondaryCtaLabel ? (
              <Button variant="soft" size="lg" className="rounded-full px-6" asChild>
                <Link to={secondaryCtaTo}>
                  {secondaryCtaLabel}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-24 size-64 rounded-full bg-secondary/15 blur-3xl" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div>
          {badge ? (
            <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {badge}
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-4xl font-black leading-tight text-foreground md:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="pill" size="lg" className="rounded-full" asChild>
              <Link to={ctaTo}>{ctaLabel}</Link>
            </Button>
            {secondaryCtaLabel ? (
              <Button variant="soft" size="lg" className="rounded-full" asChild>
                <Link to={secondaryCtaTo}>{secondaryCtaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {showMockups ? (
          <div className="relative mx-auto h-[18rem] w-full max-w-md auth-mockup-stage md:h-[22rem]">
            {AUTH_HERO_MOCKUPS.map((mockup) => (
              <div key={mockup.imageSrc} className={cn(mockup.className, 'auth-mockup-shell')}>
                <div className="auth-mockup-float">
                  <img
                    src={mockup.imageSrc}
                    alt={mockup.alt}
                    decoding="async"
                    className="w-full rounded-2xl border border-white/60 object-cover shadow-xl ring-1 ring-black/5"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
