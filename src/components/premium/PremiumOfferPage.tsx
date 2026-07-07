import { Link } from '@tanstack/react-router'
import { ArrowLeft, Crown, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PremiumCelebrationOverlay } from '@/components/subscription/PremiumCelebrationOverlay'
import { SubscriptionCompareTable } from '@/components/subscription/SubscriptionCompareTable'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageHeader, Pill } from '@/design-system'
import { useStartPremiumTrial, useSubscriptionSummary } from '@/hooks/useSubscription'
import { trackEvent } from '@/lib/analytics/track-event'
import type { BillingPeriod } from '@/lib/subscription/plans'
import {
  annualSavingsPercent,
  formatPriceEuros,
  monthlyEquivalentFromAnnual,
  PREMIUM_PLAN,
} from '@/lib/subscription/plans'

export function PremiumOfferPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual')
  const [showCelebration, setShowCelebration] = useState(false)
  const { isPremium } = useSubscriptionSummary()
  const startTrial = useStartPremiumTrial()

  useEffect(() => {
    trackEvent('paywall_view', { billingPeriod })
  }, [billingPeriod])

  const priceLabel =
    billingPeriod === 'annual'
      ? `${monthlyEquivalentFromAnnual(PREMIUM_PLAN)}/mois, facturé ${formatPriceEuros(PREMIUM_PLAN.annualPriceCents)}/an`
      : `${formatPriceEuros(PREMIUM_PLAN.monthlyPriceCents)}/mois`

  async function handleStartTrial() {
    trackEvent('paywall_cta_click', { billingPeriod })
    await startTrial.mutateAsync(billingPeriod)
    trackEvent('paywall_conversion', { billingPeriod, status: 'trialing' })
    setShowCelebration(true)
  }

  return (
    <>
      <div className="space-y-4 pb-8">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 rounded-full border-border/70 bg-card shadow-sm"
            asChild
          >
            <Link to="/app/profile" aria-label="Retour au profil">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <PageHeader
            eyebrow="RCoach Premium"
            title="Progressez plus vite, sans réfléchir à vos charges"
            description="Débloquez un accompagnement complet pour atteindre vos objectifs plus sereinement."
          />
        </div>

        <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="solid-primary">Essai gratuit {PREMIUM_PLAN.trialDays} jours</Pill>
              {billingPeriod === 'annual' ? (
                <Pill tone="accent">Économisez {annualSavingsPercent(PREMIUM_PLAN)}%</Pill>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Crown className="size-6" aria-hidden />
              </span>
              <div>
                <CardTitle className="font-display text-xl font-black">
                  Un coach dans votre poche
                </CardTitle>
                <CardDescription className="mt-1">
                  Nutrition, entraînement et motivation réunis dans une seule offre.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="billing-period" className="text-sm">
                  Facturation annuelle
                </Label>
                <p className="text-xs text-muted-foreground">
                  {billingPeriod === 'annual' ? 'Meilleure offre' : 'Facturation mensuelle'}
                </p>
              </div>
              <Switch
                id="billing-period"
                checked={billingPeriod === 'annual'}
                onCheckedChange={(checked) =>
                  setBillingPeriod(checked ? 'annual' : 'monthly')
                }
              />
            </div>

            <div className="rounded-xl bg-card/80 px-3 py-2 text-center">
              <p className="font-display text-2xl font-black text-foreground">{priceLabel}</p>
              <p className="text-xs text-muted-foreground">
                {PREMIUM_PLAN.trialDays} jours gratuits, puis facturation selon l’offre choisie
              </p>
            </div>

            <Button
              type="button"
              variant="pill"
              className="w-full gap-2"
              disabled={isPremium || startTrial.isPending}
              onClick={() => void handleStartTrial()}
            >
              <Sparkles className="size-4" aria-hidden />
              {isPremium ? 'Premium déjà actif' : 'Commencer l’essai gratuit'}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Sans engagement · Annulable à tout moment · Aucun paiement avant la fin de l’essai
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <button type="button" className="underline-offset-2 hover:underline">
                Restaurer mes achats
              </button>
              <Link to="/app/profile/settings" className="underline-offset-2 hover:underline">
                CGU
              </Link>
              <Link to="/app/profile/settings" className="underline-offset-2 hover:underline">
                Confidentialité
              </Link>
            </div>
          </CardContent>
        </Card>

        <SubscriptionCompareTable />

        {isPremium ? (
          <Button variant="soft" className="w-full" asChild>
            <Link to="/app/profile/subscription">Gérer mon abonnement</Link>
          </Button>
        ) : null}
      </div>

      <PremiumCelebrationOverlay
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </>
  )
}
