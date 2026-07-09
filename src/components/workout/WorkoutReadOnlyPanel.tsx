import { Dumbbell } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkoutSummaryHeader } from '@/components/workout/WorkoutSummaryHeader'
import { DisplayExercise } from '@/components/workout/DisplayExerciseName'
import { Pill } from '@/design-system'
import type { Profile, WorkoutSummary } from '@/lib/graphql/operations'
import {
  computeWorkoutVolume,
  countWorkoutPersonalRecords,
  formatWorkoutDuration,
} from '@/lib/stats/workout-metrics'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

type WorkoutReadOnlyPanelProps = {
  workout: WorkoutSummary
  profile: Pick<Profile, 'display_name' | 'avatar_url' | 'is_premium'> | null | undefined
  allWorkouts?: WorkoutSummary[]
}

export function WorkoutReadOnlyPanel({
  workout,
  profile,
  allWorkouts = [],
}: WorkoutReadOnlyPanelProps) {
  const displayName = profile?.display_name ?? 'Athlète'
  const duration = formatWorkoutDuration(workout.started_at, workout.ended_at)
  const volumeKg = computeWorkoutVolume(workout)
  const recordsCount = countWorkoutPersonalRecords(workout, allWorkouts)

  return (
    <div className="space-y-4">
      <WorkoutSummaryHeader
        displayName={displayName}
        avatarUrl={profile?.avatar_url ?? null}
        isPremium={profile?.is_premium ?? false}
        startedAt={workout.started_at}
        title={workout.title}
        duration={duration}
        volumeKg={volumeKg}
        recordsCount={recordsCount}
      />

      <Card className="rounded-2xl border-border bg-background/50">
        <CardHeader>
          <CardTitle className="font-display font-black">Exercices</CardTitle>
          <CardDescription>
            {workout.workout_exercises.length} exercice(s) enregistrés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workout.workout_exercises.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-black">
                    {entry.exercise ? (
                      <DisplayExercise
                        exercise={entry.exercise}
                        className="font-display font-black"
                      />
                    ) : (
                      <span>Exercice supprimé</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.exercise?.muscle_group ?? '—'}
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
