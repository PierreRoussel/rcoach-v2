import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

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
  useSubscriptionSummary,
  useUpdateSubscription,
} from '@/hooks/useSubscription'
import type { SubscriptionStatus } from '@/lib/graphql/operations'

export const Route = createFileRoute('/app/profile/subscription')({
  component: SubscriptionManagementPage,
})

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  trialing: 'Essai gratuit',
  canceled: 'Résilié',
  past_due: 'Paiement en attente',
}

function SubscriptionManagementPage() {
  const {
    subscription,
    tier,
    status,
    billingPeriod,
    isPremium,
    isPastDue,
    currentPeriodEnd,
  } = useSubscriptionSummary()
  const updateSubscription = useUpdateSubscription()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [devMessage, setDevMessage] = useState<string | null>(null)

  const renewalLabel = currentPeriodEnd
    ? format(new Date(currentPeriodEnd), 'd MMMM yyyy', { locale: fr })
    : '—'

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

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Offre actuelle</CardTitle>
          <CardDescription>Votre plan et votre statut de facturation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={isPremium ? 'solid-primary' : 'default'}>
              {tier === 'premium' ? 'Premium' : 'Gratuit'}
            </Pill>
            <Pill tone={isPastDue ? 'accent' : 'secondary'}>{STATUS_LABELS[status]}</Pill>
            {billingPeriod ? (
              <Pill tone="purple">
                {billingPeriod === 'annual' ? 'Annuel' : 'Mensuel'}
              </Pill>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {isPremium
              ? `Renouvellement prévu le ${renewalLabel}.`
              : 'Passez en Premium pour débloquer toutes les fonctionnalités.'}
          </p>
          {!isPremium ? (
            <Button variant="pill" className="w-full" asChild>
              <Link to="/app/premium">Voir les offres Premium</Link>
            </Button>
          ) : (
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
                checked={isPremium && status !== 'past_due'}
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
