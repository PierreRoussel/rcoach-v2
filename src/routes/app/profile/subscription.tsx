import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { CancelSubscriptionFlow } from '@/components/subscription/CancelSubscriptionFlow'
import { TrialUpgradeCard } from '@/components/subscription/TrialUpgradeCard'
import { LegalLinksRow } from '@/components/legal/LegalLinksRow'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { PageHeader, Pill } from '@/design-system'
import {
  useCancelSubscription,
  useOpenSubscriptionManagement,
  usePurchasePremium,
  useStartPremiumTrial,
  useSubscription,
  useSubscriptionSummary,
} from '@/hooks/useSubscription'
import { isBillingAvailable } from '@/lib/billing/billing-channel'
import { subscriptionDisplayStatus } from '@/lib/subscription/subscription-labels'
import type { BillingPeriod } from '@/lib/subscription/plans'

const subscriptionSearchSchema = z.object({
  intent: z.enum(['upgrade']).optional(),
  billingPeriod: z.enum(['monthly', 'annual']).optional(),
  checkout: z.enum(['success', 'canceled']).optional(),
})

export const Route = createFileRoute('/app/profile/subscription')({
  validateSearch: subscriptionSearchSchema,
  component: SubscriptionManagementPage,
})

function SubscriptionManagementPage() {
  const { intent, billingPeriod: searchBillingPeriod, checkout } = Route.useSearch()
  const {
    subscription,
    status,
    billingPeriod,
    provider,
    isPremium,
    isPastDue,
    isBillingManaged,
    currentPeriodEnd,
  } = useSubscriptionSummary()
  const subscriptionQuery = useSubscription()
  const purchasePremium = usePurchasePremium()
  const startTrial = useStartPremiumTrial()
  const cancelSubscription = useCancelSubscription()
  const openManagement = useOpenSubscriptionManagement()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [upgradeBillingPeriod, setUpgradeBillingPeriod] = useState<BillingPeriod>(
    searchBillingPeriod ?? billingPeriod ?? 'annual',
  )

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
  const billingReady = isBillingAvailable()

  useEffect(() => {
    if (searchBillingPeriod) {
      setUpgradeBillingPeriod(searchBillingPeriod)
    }
  }, [searchBillingPeriod])

  useEffect(() => {
    if (checkout === 'success') {
      setMessage('Paiement confirmé. Votre abonnement Premium sera actif dans quelques instants.')
      void subscriptionQuery.refetch()
    }
  }, [checkout, subscriptionQuery])

  async function handleConvertTrialToPaid() {
    setMessage(null)
    try {
      await purchasePremium.mutateAsync({ billingPeriod: upgradeBillingPeriod })
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Impossible d’activer l’abonnement.',
      )
    }
  }

  async function handleCancelTrial() {
    setMessage(null)
    try {
      await cancelSubscription.mutateAsync()
      setMessage('Essai annulé. Vous êtes repassé au plan Gratuit.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Impossible d’annuler l’essai.',
      )
    }
  }

  async function handleUpdatePayment() {
    setMessage(null)
    if (provider !== 'play' && provider !== 'stripe') {
      setMessage('Aucun moyen de paiement associé à ce compte.')
      return
    }

    try {
      await openManagement.mutateAsync(provider)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Impossible d’ouvrir la gestion du paiement.',
      )
    }
  }

  async function handleDevStartTrial() {
    setMessage(null)
    try {
      await startTrial.mutateAsync({ billingPeriod: upgradeBillingPeriod })
      setMessage('Essai gratuit démarré.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Impossible de démarrer l’essai.',
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

      {message ? <FeedbackMessage variant="success">{message}</FeedbackMessage> : null}

      {isPastDue ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-3 p-4">
            <Pill tone="accent">Paiement en attente</Pill>
            <p className="text-sm text-muted-foreground">
              Votre dernier paiement n’a pas abouti. Mettez à jour votre moyen de paiement pour
              conserver l’accès Premium.
            </p>
            <Button
              variant="pill"
              className="w-full"
              disabled={!isBillingManaged || openManagement.isPending}
              onClick={() => void handleUpdatePayment()}
            >
              {openManagement.isPending ? 'Ouverture...' : 'Mettre à jour le paiement'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {showUpgradeIntent || isTrialing ? (
        currentPeriodEnd ? (
          <TrialUpgradeCard
            periodEnd={currentPeriodEnd}
            billingPeriod={upgradeBillingPeriod}
            onBillingPeriodChange={setUpgradeBillingPeriod}
            onSubscribe={() => void handleConvertTrialToPaid()}
            onCancelTrial={() => void handleCancelTrial()}
            isSubscribePending={purchasePremium.isPending}
            isCancelPending={cancelSubscription.isPending}
            billingReady={billingReady}
          />
        ) : null
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
            {provider !== 'none' ? (
              <Pill tone="secondary">
                {provider === 'play' ? 'Google Play' : provider === 'stripe' ? 'Stripe' : provider}
              </Pill>
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
              {isBillingManaged ? (
                <Button
                  type="button"
                  variant="soft"
                  className="flex-1"
                  disabled={openManagement.isPending}
                  onClick={() => void handleUpdatePayment()}
                >
                  Gérer le paiement
                </Button>
              ) : (
                <Button variant="soft" className="flex-1" asChild>
                  <Link to="/app/premium">Changer d’offre</Link>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCancelOpen(true)}
              >
                {isBillingManaged ? 'Résilier via le store' : 'Résilier'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {import.meta.env.DEV ? (
        <Card className="rounded-2xl border-dashed border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Outils développeur</CardTitle>
            <CardDescription>
              Les abonnements payants passent par Google Play (Android) ou Stripe (PWA). Utilisez
              l’essai gratuit pour tester le gating Premium.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={startTrial.isPending}
              onClick={() => void handleDevStartTrial()}
            >
              Démarrer un essai gratuit (7 jours)
            </Button>
            {subscription?.id ? (
              <p className="text-xs text-muted-foreground">ID abonnement : {subscription.id}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <LegalLinksRow includeCgv className="justify-start px-1" />

      <CancelSubscriptionFlow open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  )
}
