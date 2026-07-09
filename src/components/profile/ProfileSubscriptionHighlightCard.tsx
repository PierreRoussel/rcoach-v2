import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowRight, Crown, Sparkles, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { useSubscriptionSummary } from '@/hooks/useSubscription'
import { billingPeriodLabel } from '@/lib/subscription/subscription-labels'
import { PREMIUM_PLAN } from '@/lib/subscription/plans'
import {
  buildTrialUpgradeSearch,
  getTrialDaysLeft,
} from '@/lib/subscription/trial-lifecycle'
import { cn } from '@/lib/utils'

const FREE_UPSELL_POINTS = [
  'Charges et nutrition sans limite',
  'Historique et stats avancées',
  'Modèles de séance illimités',
] as const

export function ProfileSubscriptionHighlightCard() {
  const {
    isPremium,
    isPastDue,
    isLoading,
    status,
    billingPeriod,
    currentPeriodEnd,
    canStartTrial,
  } = useSubscriptionSummary()

  if (isLoading) {
    return (
      <div className="h-36 animate-pulse rounded-2xl border border-border bg-muted/30" aria-hidden />
    )
  }

  if (isPastDue) {
    return (
      <div className="overflow-hidden rounded-2xl border border-destructive/35 bg-gradient-to-br from-destructive/10 to-card p-4 sm:p-5">
        <Pill tone="accent" className="mb-3">
          Paiement en attente
        </Pill>
        <h2 className="font-display text-lg font-black">Réactivez votre Premium</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mettez à jour votre moyen de paiement pour conserver vos avantages.
        </p>
        <Button variant="pill" className="mt-4 w-full" asChild>
          <Link to="/app/profile/subscription">Corriger le paiement</Link>
        </Button>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-amber-500/10 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/30 to-amber-600/10 text-amber-500"
            aria-hidden
          >
            <Crown className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Pill tone="solid-gold" className="mb-2 gap-1">
              <Sparkles className="size-3.5" aria-hidden />
              {canStartTrial
                ? `Essai gratuit ${PREMIUM_PLAN.trialDays} jours`
                : 'Offre Premium'}
            </Pill>
            <h2 className="font-display text-lg font-black leading-tight">
              Passez au niveau supérieur
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Débloquez un accompagnement complet pour progresser plus vite.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {FREE_UPSELL_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm text-foreground/90">
              <Zap className="size-4 shrink-0 text-primary" aria-hidden />
              {point}
            </li>
          ))}
        </ul>

        <Button variant="pill" className="mt-4 h-11 w-full gap-2 font-semibold" asChild>
          <Link to="/app/premium">
            <Sparkles className="size-4" aria-hidden />
            {canStartTrial ? 'Essayer Premium gratuitement' : 'Découvrir Premium'}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    )
  }

  const endLabel = currentPeriodEnd
    ? format(new Date(currentPeriodEnd), 'd MMMM yyyy', { locale: fr })
    : null
  const isTrialing = status === 'trialing'
  const daysLeft = getTrialDaysLeft(currentPeriodEnd)
  const upgradeSearch = buildTrialUpgradeSearch(billingPeriod)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-5',
        isTrialing
          ? 'border-amber-300/40 bg-gradient-to-br from-amber-500/12 via-card to-primary/8'
          : 'border-primary/30 bg-gradient-to-br from-primary/12 via-card to-amber-500/8',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/35 to-amber-600/15 text-amber-500"
            aria-hidden
          >
            <Crown className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Pill tone={isTrialing ? 'solid-gold' : 'solid-primary'} className="gap-1">
                <Sparkles className="size-3.5" aria-hidden />
                {isTrialing ? 'Essai Premium' : 'Membre Premium'}
              </Pill>
              {billingPeriod ? (
                <Pill tone="purple">{billingPeriodLabel(billingPeriod)}</Pill>
              ) : null}
            </div>
            <h2 className="font-display text-lg font-black leading-tight">
              {isTrialing ? 'Profitez de tout Premium' : 'Votre coach complet est actif'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isTrialing && daysLeft != null && daysLeft > 0
                ? `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} — fin le ${endLabel ?? '—'}.`
                : endLabel
                  ? isTrialing
                    ? `Essai jusqu’au ${endLabel}.`
                    : `Renouvellement le ${endLabel}.`
                  : 'Accès à toutes les fonctionnalités avancées.'}
            </p>
          </div>
        </div>
      </div>

      {isTrialing && daysLeft != null && daysLeft > 0 ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              daysLeft <= 2 ? 'bg-destructive' : daysLeft <= 5 ? 'bg-amber-500' : 'bg-primary',
            )}
            style={{
              width: `${Math.min(100, Math.max(8, (daysLeft / PREMIUM_PLAN.trialDays) * 100))}%`,
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {isTrialing ? (
          <Button variant="pill" className="h-11 flex-1 gap-2 font-semibold" asChild>
            <Link to="/app/profile/subscription" search={upgradeSearch}>
              <Sparkles className="size-4" aria-hidden />
              Continuer en Premium
            </Link>
          </Button>
        ) : (
          <Button variant="pill" className="h-11 flex-1 gap-2 font-semibold" asChild>
            <Link to="/app/profile/subscription">
              Gérer mon abonnement
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
        {!isTrialing ? (
          <Button variant="outline" className="h-11 flex-1 rounded-full" asChild>
            <Link to="/app/premium">Voir les avantages</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
