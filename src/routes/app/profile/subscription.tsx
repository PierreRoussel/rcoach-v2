import { createFileRoute, Link } from '@tanstack/react-router'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { CancelSubscriptionFlow } from '@/components/subscription/CancelSubscriptionFlow'
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
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { PageHeader, Pill } from '@/design-system'
import {
  useCancelSubscription,
  useSubscriptionSummary,
  useUpdateSubscription,
} from '@/hooks/useSubscription'
import {
  billingPeriodLabel,
  subscriptionDisplayStatus,
} from '@/lib/subscription/subscription-labels'
import { buildTrialDowngradePatch, markTrialEndedPeriod } from '@/lib/subscription/trial-lifecycle'
import type { BillingPeriod } from '@/lib/subscription/plans'

const subscriptionSearchSchema = z.object({
  intent: z.enum(['upgrade']).optional(),
  billingPeriod: z.enum(['monthly', 'annual']).optional(),
})

export const Route = createFileRoute('/app/profile/subscription')({
  validateSearch: subscriptionSearchSchema,
  component: SubscriptionManagementPage,
})

function SubscriptionManagementPage() {
  const { intent, billingPeriod: searchBillingPeriod } = Route.useSearch()
  const {
    subscription,
    status,
    billingPeriod,
    isPremium,
    isPastDue,
    currentPeriodEnd,
  } = useSubscriptionSummary()
  const updateSubscription = useUpdateSubscription()
  const cancelSubscription = useCancelSubscription()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [devMessage, setDevMessage] = useState<string | null>(null)

  const display = subscription
    ? subscriptionDisplayStatus(subscription)
    : {
        tierLabel: 'Gratuit',
        statusLabel: 'Actif',
        billingLabel: null,
        periodContext: null,
      }

  const renewalLabel = currentPeriodEnd
    ? format(new Date(currentPeriodEnd), 'd MMMM yyyy', { locale: fr })
    : '—'

  const isTrialing = status === 'trialing'
  const showUpgradeIntent = intent === 'upgrade' && isTrialing
  const selectedBillingPeriod: BillingPeriod =
    searchBillingPeriod ?? billingPeriod ?? 'annual'

  async function handleConvertTrialToPaid() {
    setDevMessage(null)
    try {
      await updateSubscription.mutateAsync({
        tier: 'premium',
        status: 'active',
        billing_period: selectedBillingPeriod,
        current_period_end: addDays(new Date(), selectedBillingPeriod === 'annual' ? 365 : 30).toISOString(),
        provider: 'none',
      })
      setDevMessage('Abonnement payant activé (simulation).')
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible d’activer l’abonnement.',
      )
    }
  }

  async function handleCancelTrial() {
    setDevMessage(null)
    try {
      await cancelSubscription.mutateAsync()
      setDevMessage('Essai annulé. Vous êtes repassé au plan Gratuit.')
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible d’annuler l’essai.',
      )
    }
  }

  async function handleDevSimulatePremium(checked: boolean) {
    setDevMessage(null)
    try {
      await updateSubscription.mutateAsync(
        checked
          ? {
              tier: 'premium',
              status: 'active',
              billing_period: 'annual',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : {
              tier: 'free',
              status: 'active',
              billing_period: null,
              current_period_end: null,
            },
      )
      setDevMessage(checked ? 'Premium simulé.' : 'Retour au plan Gratuit.')
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible de mettre à jour l’abonnement.',
      )
    }
  }

  async function handleDevSimulatePastDue(checked: boolean) {
    setDevMessage(null)
    try {
      await updateSubscription.mutateAsync({
        tier: 'premium',
        status: checked ? 'past_due' : 'active',
        billing_period: billingPeriod ?? 'monthly',
      })
      setDevMessage(checked ? 'Paiement en attente simulé.' : 'Paiement régularisé.')
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible de mettre à jour le statut.',
      )
    }
  }

  async function handleDevSimulateTrialMilestone(daysLeft: number) {
    setDevMessage(null)
    try {
      await updateSubscription.mutateAsync({
        tier: 'premium',
        status: 'trialing',
        billing_period: billingPeriod ?? 'annual',
        current_period_end: addDays(new Date(), daysLeft).toISOString(),
        provider: 'none',
      })
      setDevMessage(`Essai simulé — fin dans ${daysLeft} jour(s).`)
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible de simuler l’essai.',
      )
    }
  }

  async function handleDevSimulateTrialExpired() {
    setDevMessage(null)
    try {
      if (currentPeriodEnd) {
        markTrialEndedPeriod(currentPeriodEnd)
      }
      await updateSubscription.mutateAsync(buildTrialDowngradePatch())
      setDevMessage('Fin d’essai simulée.')
    } catch (error) {
      setDevMessage(
        error instanceof Error ? error.message : 'Impossible de simuler la fin d’essai.',
      )
    }
  }

  return (
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
          title="Mon abonnement"
          description="Consultez votre offre, votre renouvellement et gérez votre abonnement."
        />
      </div>

      {isPastDue ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-3 p-4">
            <Pill tone="accent">Paiement en attente</Pill>
            <p className="text-sm text-muted-foreground">
              Votre dernier paiement n’a pas abouti. Mettez à jour votre moyen de paiement pour
              conserver l’accès Premium.
            </p>
            <Button variant="pill" className="w-full" disabled>
              Mettre à jour le paiement (bientôt)
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {showUpgradeIntent || isTrialing ? (
        <Card className="rounded-2xl border-amber-300/50 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="font-display font-black">
              Passer à l&apos;abonnement payant
            </CardTitle>
            <CardDescription>
              Votre essai se termine le {renewalLabel}. Activez la facturation pour conserver vos
              avantages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Pill tone="purple">{billingPeriodLabel(selectedBillingPeriod)}</Pill>
            <Button
              variant="pill"
              className="w-full"
              disabled={updateSubscription.isPending}
              onClick={() => void handleConvertTrialToPaid()}
            >
              Activer la facturation (simulation)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={cancelSubscription.isPending}
              onClick={() => void handleCancelTrial()}
            >
              Annuler l&apos;essai
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Offre actuelle</CardTitle>
          <CardDescription>Votre plan et votre statut de facturation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={isPremium ? 'solid-primary' : 'default'}>{display.tierLabel}</Pill>
            <Pill tone={isPastDue ? 'accent' : 'secondary'}>{display.statusLabel}</Pill>
            {display.billingLabel ? (
              <Pill tone="purple">{display.billingLabel}</Pill>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {display.periodContext ??
              (isPremium
                ? `Renouvellement prévu le ${renewalLabel}.`
                : 'Passez en Premium pour débloquer toutes les fonctionnalités.')}
          </p>
          {!isPremium ? (
            <Button variant="pill" className="w-full" asChild>
              <Link to="/app/premium">Voir les offres Premium</Link>
            </Button>
          ) : isTrialing ? null : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="soft" className="flex-1" asChild>
                <Link to="/app/premium">Changer d’offre</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCancelOpen(true)}
              >
                Résilier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {import.meta.env.DEV ? (
        <Card className="rounded-2xl border-dashed border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Outils développeur</CardTitle>
            <CardDescription>Simulez un abonnement pour tester le gating Premium.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="dev-premium">Simuler Premium</Label>
              <Switch
                id="dev-premium"
                checked={isPremium && status !== 'past_due' && !isTrialing}
                disabled={updateSubscription.isPending}
                onCheckedChange={(checked) => void handleDevSimulatePremium(checked)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="dev-past-due">Simuler paiement en attente</Label>
              <Switch
                id="dev-past-due"
                checked={isPastDue}
                disabled={updateSubscription.isPending || !isPremium}
                onCheckedChange={(checked) => void handleDevSimulatePastDue(checked)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDevSimulateTrialMilestone(5)}
              >
                Simuler J-5
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDevSimulateTrialMilestone(2)}
              >
                Simuler J-2
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDevSimulateTrialExpired()}
              >
                Simuler fin d&apos;essai
              </Button>
            </div>
            {devMessage ? <FeedbackMessage variant="success">{devMessage}</FeedbackMessage> : null}
            {subscription?.id ? (
              <p className="text-xs text-muted-foreground">ID abonnement : {subscription.id}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <CancelSubscriptionFlow open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  )
}
