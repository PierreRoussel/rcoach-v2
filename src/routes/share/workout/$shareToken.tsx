import { createFileRoute } from '@tanstack/react-router'
import { format, formatDistanceStrict } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Trophy } from 'lucide-react'

import { WorkoutDetailContent } from '@/components/workout/WorkoutDetailContent'
import { WorkoutShareCard } from '@/components/workout/WorkoutShareCard'
import { BrandLogo, PageHeader, Pill } from '@/design-system'
import { useSharedWorkoutByToken } from '@/hooks/useWorkoutSharing'
import {
  computeWorkoutVolume,
  formatWorkoutVolume,
} from '@/lib/stats/workout-metrics'

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
          {error instanceof Error ? error.message : 'Séance introuvable.'}
        </p>
      </div>
    )
  }

  const volumeKg = computeWorkoutVolume(workout)
  const duration =
    workout.ended_at != null
      ? formatDistanceStrict(
          new Date(workout.started_at),
          new Date(workout.ended_at),
          { locale: fr },
        )
      : null
  const dateLabel = format(new Date(workout.started_at), "d MMMM yyyy 'à' HH:mm", {
    locale: fr,
  })

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
      <BrandLogo compact />
      <div className="mt-6 space-y-4">
        <div className="flex justify-center">
          <WorkoutShareCard
            workout={workout}
            authorName={workout.user?.display_name}
            className="w-full max-w-[320px]"
          />
        </div>

        <PageHeader
          eyebrow="Séance partagée"
          title={workout.title}
          description={
            workout.user?.display_name
              ? `Par ${workout.user.display_name} · ${dateLabel}`
              : dateLabel
          }
        />

        <div className="flex flex-wrap gap-2">
          {duration ? <Pill tone="secondary">{duration}</Pill> : null}
          <Pill tone="solid-primary">{formatWorkoutVolume(volumeKg)}</Pill>
          <Pill tone="solid-gold" className="gap-1">
            <Trophy className="size-3" />
            {workout.workout_exercises.length} exercice(s)
          </Pill>
        </div>

        <WorkoutDetailContent
          workout={workout}
          authorName={workout.user?.display_name}
        />
      </div>
    </div>
  )
}
