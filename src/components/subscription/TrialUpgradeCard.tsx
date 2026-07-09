import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, Crown, Sparkles } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Pill } from '@/design-system'
import { trackEvent } from '@/lib/analytics/track-event'
import type { BillingPeriod } from '@/lib/subscription/plans'
import {
  annualSavingsPercent,
  formatPriceEuros,
  monthlyEquivalentFromAnnual,
  PREMIUM_PLAN,
} from '@/lib/subscription/plans'
import { getTrialDaysLeft } from '@/lib/subscription/trial-lifecycle'
import { cn } from '@/lib/utils'

const RETENTION_HIGHLIGHTS = [
  'Historique et statistiques avancées sans limite',
  'Modèles de séance toujours actifs (pas de gel)',
  'Conseils nutrition et charges illimités',
  'Thème Pro et badge sur votre avatar',
] as const

type TrialUpgradeCardProps = {
  periodEnd: string
  billingPeriod: BillingPeriod
  onBillingPeriodChange: (period: BillingPeriod) => void
  onSubscribe: () => void
  onCancelTrial: () => void
  isSubscribePending: boolean
  isCancelPending: boolean
  billingReady: boolean
}

function trialUrgencyTone(daysLeft: number | null): 'accent' | 'solid-gold' | 'purple' {
  if (daysLeft == null) {
    return 'purple'
  }

  if (daysLeft <= 2) {
    return 'accent'
  }

  if (daysLeft <= 5) {
    return 'solid-gold'
  }

  return 'purple'
}

function trialUrgencyLabel(daysLeft: number | null, endLabel: string): string {
  if (daysLeft == null) {
    return `Fin le ${endLabel}`
  }

  if (daysLeft <= 0) {
    return 'Essai terminé'
  }

  if (daysLeft === 1) {
    return 'Dernier jour d’essai'
  }

  if (daysLeft <= 2) {
    return `Plus que ${daysLeft} jours`
  }

  return `${daysLeft} jours restants`
}

export function TrialUpgradeCard({
  periodEnd,
  billingPeriod,
  onBillingPeriodChange,
  onSubscribe,
  onCancelTrial,
  isSubscribePending,
  isCancelPending,
  billingReady,
}: TrialUpgradeCardProps) {
  const endLabel = format(new Date(periodEnd), 'd MMMM yyyy', { locale: fr })
  const daysLeft = getTrialDaysLeft(periodEnd)
  const trialLength = PREMIUM_PLAN.trialDays
  const progressPercent =
    daysLeft == null || trialLength <= 0
      ? 0
      : Math.min(100, Math.max(8, (daysLeft / trialLength) * 100))

  const priceLabel =
    billingPeriod === 'annual'
      ? `${monthlyEquivalentFromAnnual(PREMIUM_PLAN)}/mois`
      : `${formatPriceEuros(PREMIUM_PLAN.monthlyPriceCents)}/mois`

  const billedLabel =
    billingPeriod === 'annual'
      ? `soit ${formatPriceEuros(PREMIUM_PLAN.annualPriceCents)}/an`
      : 'facturation mensuelle'

  const ctaLabel = billingReady
    ? `Continuer en Premium — ${priceLabel}`
    : 'Facturation indisponible sur cette plateforme'

  function handleSubscribe() {
    trackEvent('trial_upgrade_cta_click', { billingPeriod, daysLeft })
    onSubscribe()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-amber-500/10 shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/30 to-amber-600/10 text-amber-500"
              aria-hidden
            >
              <Crown className="size-5" />
            </div>
            <div className="min-w-0">
              <Pill tone={trialUrgencyTone(daysLeft)} className="mb-2 gap-1">
                <Sparkles className="size-3.5" aria-hidden />
                {trialUrgencyLabel(daysLeft, endLabel)}
              </Pill>
              <h2 className="font-display text-lg font-black leading-tight text-foreground">
                Gardez tout ce que vous avez débloqué
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Sans abonnement après le <strong className="font-semibold text-foreground">{endLabel}</strong>
                , vos modèles premium seront gelés et l’historique sera limité.
              </p>
            </div>
          </div>
        </div>

        {daysLeft != null && daysLeft > 0 ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Temps d’essai restant</span>
              <span className="font-medium text-foreground">
                J-{daysLeft}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  daysLeft <= 2 ? 'bg-destructive' : daysLeft <= 5 ? 'bg-amber-500' : 'bg-primary',
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <ul className="grid gap-2 sm:grid-cols-2">
          {RETENTION_HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm text-foreground/90">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 px-3 py-2.5">
          <div className="space-y-0.5">
            <Label htmlFor="trial-billing-period" className="text-sm font-medium">
              Facturation annuelle
            </Label>
            <p className="text-xs text-muted-foreground">
              {billingPeriod === 'annual'
                ? `Économisez ${annualSavingsPercent(PREMIUM_PLAN)} %`
                : 'Plus flexible, sans engagement'}
            </p>
          </div>
          <Switch
            id="trial-billing-period"
            checked={billingPeriod === 'annual'}
            onCheckedChange={(checked) =>
              onBillingPeriodChange(checked ? 'annual' : 'monthly')
            }
          />
        </div>

        <div className="rounded-xl bg-card/90 px-3 py-3 text-center ring-1 ring-border/60">
          <p className="font-display text-2xl font-black text-foreground">{priceLabel}</p>
          <p className="text-xs text-muted-foreground">{billedLabel}</p>
        </div>

        <Button
          type="button"
          variant="pill"
          className="h-12 w-full gap-2 text-base font-semibold shadow-md"
          disabled={!billingReady || isSubscribePending}
          onClick={() => void handleSubscribe()}
        >
          <Sparkles className="size-4" aria-hidden />
          {isSubscribePending ? 'Redirection vers le paiement...' : ctaLabel}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sans engagement · Annulable à tout moment · Paiement sécurisé
        </p>

        <div className="flex justify-center border-t border-border/60 pt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                disabled={isCancelPending}
              >
                {isCancelPending ? 'Annulation...' : 'Revenir au plan Gratuit'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Annuler votre essai Premium ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous perdrez l’accès aux fonctionnalités avancées et vos modèles de séance pourront
                  être gelés. Vous pourrez vous réabonner plus tard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuer l’essai</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={isCancelPending}
                  onClick={(event) => {
                    event.preventDefault()
                    onCancelTrial()
                  }}
                >
                  Oui, repasser en Gratuit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
