import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, CalendarClock, Crown, Sparkles } from 'lucide-react'
import { useEffect } from 'react'

import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { trackEvent } from '@/lib/analytics/track-event'
import type { BillingPeriod } from '@/lib/subscription/plans'
import { buildTrialUpgradeSearch } from '@/lib/subscription/trial-lifecycle'

type TrialReminderVariant = 'j5' | 'j2'

type TrialReminderOverlayProps = {
  open: boolean
  variant: TrialReminderVariant
  periodEnd: string
  billingPeriod: BillingPeriod | null
  onDismiss: () => void
}

export function TrialReminderOverlay({
  open,
  variant,
  periodEnd,
  billingPeriod,
  onDismiss,
}: TrialReminderOverlayProps) {
  const endLabel = format(new Date(periodEnd), 'd MMMM yyyy', { locale: fr })
  const upgradeSearch = buildTrialUpgradeSearch(billingPeriod)

  const handleCta = () => {
    trackEvent('trial_reminder_cta', { variant })
    onDismiss()
  }

  useEffect(() => {
    if (open) {
      trackEvent('trial_reminder_view', { variant })
    }
  }, [open, variant])

  const slides =
    variant === 'j5'
      ? [
          <div key="intro" className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
            <Crown className="mb-4 size-10 text-amber-500" aria-hidden />
            <Pill tone="solid-gold" className="gap-1">
              <Sparkles className="size-3.5" aria-hidden />
              Essai Premium
            </Pill>
            <h2 className="mt-4 font-display text-2xl font-black text-foreground">
              Votre essai se termine bientôt
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Il vous reste quelques jours pour profiter de toutes les fonctionnalités Premium.
            </p>
          </div>,
          <div key="features" className="mx-auto w-full max-w-sm space-y-4 text-center">
            <CalendarClock className="mx-auto size-10 text-amber-500" aria-hidden />
            <h3 className="font-display text-xl font-black text-foreground">
              Fin prévue le {endLabel}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Statistiques avancées, coach anti-stagnation, historique illimité, conseils
              nutrition et bien plus encore.
            </p>
          </div>,
          <div key="cta" className="mx-auto w-full max-w-sm space-y-4 text-center">
            <h3 className="font-display text-xl font-black text-foreground">
              Conservez vos avantages
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Activez la facturation pour continuer sans interruption.
            </p>
            <Button variant="pill" className="w-full" asChild onClick={handleCta}>
              <Link to="/app/profile/subscription" search={upgradeSearch}>
                Gérer mon abonnement
              </Link>
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onDismiss}>
              Plus tard
            </Button>
          </div>,
        ]
      : [
          <div key="urgent" className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
            <AlertTriangle className="mb-4 size-10 text-amber-500" aria-hidden />
            <Pill tone="accent">Derniers jours</Pill>
            <h2 className="mt-4 font-display text-2xl font-black text-foreground">
              Plus que 2 jours
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Votre essai Premium se termine le {endLabel}.
            </p>
          </div>,
          <div key="cta" className="mx-auto w-full max-w-sm space-y-4 text-center">
            <h3 className="font-display text-xl font-black text-foreground">
              Passez à l&apos;abonnement payant
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Évitez la perte de vos privilèges et le gel de vos modèles de séance.
            </p>
            <Button variant="pill" className="w-full" asChild onClick={handleCta}>
              <Link to="/app/profile/subscription" search={upgradeSearch}>
                Passer à l&apos;abonnement payant
              </Link>
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onDismiss}>
              Plus tard
            </Button>
          </div>,
        ]

  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel={variant === 'j5' ? 'Rappel essai J-5' : 'Rappel essai J-2'}
      slides={slides}
      onDismissLastStep={onDismiss}
    />
  )
}
