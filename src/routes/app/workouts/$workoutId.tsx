import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Dumbbell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkoutDetailMenu } from '@/components/workout/WorkoutDetailMenu'
import { WorkoutSummaryHeader } from '@/components/workout/WorkoutSummaryHeader'
import { Pill } from '@/design-system'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { useMyProfile } from '@/hooks/useProfile'
import { useMyWorkouts, useWorkoutById } from '@/hooks/useWorkouts'
import {
  computeWorkoutVolume,
  countWorkoutPersonalRecords,
  formatWorkoutDuration,
} from '@/lib/stats/workout-metrics'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

export const Route = createFileRoute('/app/workouts/$workoutId')({
  component: WorkoutDetailPage,
})

function WorkoutDetailPage() {
  const { workoutId } = Route.useParams()
  const { data: workout, isLoading, error } = useWorkoutById(workoutId)
  const { data: profile } = useMyProfile()
  const { data: allWorkouts } = useMyWorkouts()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>
  }

  if (error || !workout) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Seance introuvable.'}
      </p>
    )
  }

  const duration = formatWorkoutDuration(workout.started_at, workout.ended_at)
  const volumeKg = computeWorkoutVolume(workout)
  const recordsCount = countWorkoutPersonalRecords(workout, allWorkouts ?? [])

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/app/sessions" search={{ tab: 'history' }}>
          <ArrowLeft className="size-4" />
          Historique
        </Link>
      </Button>

      <WorkoutSummaryHeader
        displayName={profile?.display_name ?? 'Athlète'}
        avatarUrl={profile?.avatar_url ?? null}
        startedAt={workout.started_at}
        title={workout.title}
        duration={duration}
        volumeKg={volumeKg}
        recordsCount={recordsCount}
        actions={<WorkoutDetailMenu workout={workout} />}
      />

      {workout.notes ? (
        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {workout.notes}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Exercices</CardTitle>
          <CardDescription>
            {workout.workout_exercises.length} exercice(s) enregistres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workout.workout_exercises.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-black">
                    <DisplayExerciseName name={entry.exercise.name} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.exercise.muscle_group ?? '—'}
                  </p>
                </div>
                <Pill tone="secondary">
                  <Dumbbell className="size-3" />
                  {entry.sets.length} sets
                </Pill>
              </div>
              {entry.sets.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {entry.sets.map((set) => (
                    <li
                      key={set.set_index}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                    >
                      <span className="font-data text-xs text-muted-foreground">
                        Set {set.set_index + 1}
                        {set.set_type !== 'normal' ? ` · ${set.set_type}` : ''}
                      </span>
                      <span className="font-medium">
                        {formatSetPerformanceSummary(set) ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
