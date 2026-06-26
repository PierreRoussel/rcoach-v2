import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill } from '@/design-system'
import {
  usePendingFoodRenameProposals,
  useReviewFoodRenameProposal,
} from '@/hooks/useFoodRenameAndPortions'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach/validate-product-renames/')({
  component: ValidateProductRenamesPage,
})

function ValidateProductRenamesPage() {
  const { data: profile } = useMyProfile()
  const isCoach = profile?.role === 'coach' || profile?.role === 'both'
  const { data: proposals = [], isLoading, error } = usePendingFoodRenameProposals(isCoach)
  const reviewProposal = useReviewFoodRenameProposal()
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    setMessage(null)
    setActionError(null)

    try {
      const result = await reviewProposal.mutateAsync({ id, status })
      if (status === 'approved') {
        setMessage(`Produit renommé en « ${result.food.name} ».`)
      } else {
        setMessage('Proposition refusée.')
      }
    } catch (reviewError) {
      setActionError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Impossible de traiter cette proposition.',
      )
    }
  }

  if (!isCoach) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Coach"
          title="Valider les renommages produit"
          description="Cette page est réservée aux comptes coach."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Passez votre profil en rôle coach ou both dans{' '}
            <Link to="/app/profile" className="font-semibold text-primary">
              votre profil
            </Link>{' '}
            pour accéder à la validation des renommages.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Valider les renommages produit"
        description="Approuvez ou refusez les propositions de noms envoyées par les utilisateurs."
      />

      {message ? (
        <p className="rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary-foreground">
          {message}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Impossible de charger les propositions.'}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des propositions...</p>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Aucune proposition en attente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{proposal.food.name}</CardTitle>
                    <CardDescription>
                      Proposition : <span className="font-semibold text-foreground">{proposal.proposed_name}</span>
                    </CardDescription>
                  </div>
                  <Pill tone="accent">En attente</Pill>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {proposal.proposer?.display_name
                    ? `Proposé par ${proposal.proposer.display_name}`
                    : 'Proposé par un utilisateur'}
                  {proposal.food.brand ? ` · ${proposal.food.brand}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={reviewProposal.isPending}
                    onClick={() => void handleReview(proposal.id, 'approved')}
                  >
                    <Check className="size-4" />
                    Approuver
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={reviewProposal.isPending}
                    onClick={() => void handleReview(proposal.id, 'rejected')}
                  >
                    <X className="size-4" />
                    Refuser
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
