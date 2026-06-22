import { createFileRoute } from '@tanstack/react-router'

import { WorkoutDetailContent } from '@/components/workout/WorkoutDetailContent'
import { BrandLogo, PageHeader } from '@/design-system'
import { useSharedWorkoutByToken } from '@/hooks/useWorkoutSharing'

export const Route = createFileRoute('/share/workout/$shareToken')({
  component: SharedWorkoutPage,
})

function SharedWorkoutPage() {
  const { shareToken } = Route.useParams()
  const { data: workout, isLoading, error } = useSharedWorkoutByToken(shareToken)

  if (isLoading) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
        <BrandLogo compact />
        <p className="mt-6 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Seance introuvable.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
      <BrandLogo compact />
      <div className="mt-6 space-y-4">
        <PageHeader eyebrow="Seance partagee" title={workout.title} />
        <WorkoutDetailContent
          workout={workout}
          authorName={workout.user?.display_name}
        />
      </div>
    </div>
  )
}
