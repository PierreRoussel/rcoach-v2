import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Textarea } from '@/components/ui/textarea'
import { Pill } from '@/design-system'
import {
  useCancelSubscription,
  useOpenSubscriptionManagement,
  useSubmitCancellationFeedback,
  useSubscriptionSummary,
} from '@/hooks/useSubscription'
import { isManagedByBillingProviderError } from '@/lib/subscription/trial-eligibility'
import { PREMIUM_PLAN } from '@/lib/subscription/plans'

const CANCELLATION_REASONS = [
  'Trop cher',
  'Je n’utilise pas assez',
  'Fonctionnalité manquante',
  'Problème technique',
  'Autre',
] as const

type CancelSubscriptionFlowProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCanceled?: () => void
}

export function CancelSubscriptionFlow({
  open,
  onOpenChange,
  onCanceled,
}: CancelSubscriptionFlowProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancelSubscription = useCancelSubscription()
  const submitFeedback = useSubmitCancellationFeedback()
  const openManagement = useOpenSubscriptionManagement()
  const { provider, isBillingManaged } = useSubscriptionSummary()

  function reset() {
    setStep(1)
    setReason(null)
    setComment('')
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  async function finalize(withFeedback: boolean) {
    setError(null)

    try {
      if (isBillingManaged && (provider === 'play' || provider === 'stripe')) {
        if (withFeedback && (reason || comment.trim())) {
          await submitFeedback.mutateAsync({
            reason,
            comment: comment.trim() || null,
          })
        }

        await openManagement.mutateAsync(provider)
        handleOpenChange(false)
        onCanceled?.()
        return
      }

      if (withFeedback && (reason || comment.trim())) {
        await submitFeedback.mutateAsync({
          reason,
          comment: comment.trim() || null,
        })
      }

      await cancelSubscription.mutateAsync()
      handleOpenChange(false)
      onCanceled?.()
    } catch (caughtError) {
      if (isManagedByBillingProviderError(caughtError)) {
        setError('Cet abonnement est géré par Google Play ou Stripe. Utilisez le portail de paiement.')
        return
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Impossible de résilier l’abonnement pour le moment.',
      )
    }
  }

  const isPending =
    cancelSubscription.isPending || submitFeedback.isPending || openManagement.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display font-black">
                Résilier Premium ?
              </DialogTitle>
              <DialogDescription>
                {isBillingManaged
                  ? 'Votre abonnement est géré par votre moyen de paiement. Nous allons ouvrir la page de gestion pour résilier.'
                  : 'Vous garderez l’accès Premium jusqu’à la fin de la période en cours. Ensuite, vous perdrez :'}
              </DialogDescription>
            </DialogHeader>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {isBillingManaged
                ? null
                : PREMIUM_PLAN.features.slice(0, 4).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
            </ul>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Garder Premium
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Continuer la résiliation
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display font-black">
                Un dernier mot ? (facultatif)
              </DialogTitle>
              <DialogDescription>
                Votre avis nous aide à améliorer RCoach. Vous pouvez passer cette étape.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {CANCELLATION_REASONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReason(option)}
                    className="rounded-full"
                  >
                    <Pill tone={reason === option ? 'solid-primary' : 'default'}>{option}</Pill>
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Commentaire libre (facultatif)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
              />
            </div>
            {error ? <FeedbackMessage variant="error">{error}</FeedbackMessage> : null}
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                variant="pill"
                disabled={isPending}
                onClick={() => void finalize(true)}
              >
                {isBillingManaged ? 'Ouvrir la gestion' : 'Envoyer et résilier'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => void finalize(false)}
              >
                {isBillingManaged ? 'Résilier sans avis' : 'Résilier sans avis'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
