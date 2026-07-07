import { Link } from '@tanstack/react-router'
import { Dumbbell } from 'lucide-react'

import { WorkoutDetailMenu } from '@/components/workout/WorkoutDetailMenu'
import { WorkoutSummaryHeader } from '@/components/workout/WorkoutSummaryHeader'
import type { Profile, WorkoutSummary } from '@/lib/graphql/operations'
import {
  computeWorkoutVolume,
  countWorkoutPersonalRecords,
  formatWorkoutDuration,
} from '@/lib/stats/workout-metrics'
import { countWorkoutSets } from '@/hooks/useWorkouts'
import { DisplayExercise } from '@/components/workout/DisplayExerciseName'
import { cn } from '@/lib/utils'

const VISIBLE_EXERCISES = 3

type WorkoutHistoryCardProps = {
  workout: WorkoutSummary
  profile: Pick<Profile, 'display_name' | 'avatar_url'> | null | undefined
  allWorkouts?: WorkoutSummary[]
  /** Pleine largeur dans une liste (sans bordure interne). */
  variant?: 'standalone' | 'embedded'
  className?: string
}

function formatExerciseSummary(
  entry: WorkoutSummary['workout_exercises'][number],
) {
  const setCount = entry.sets.length
  const equipment = entry.exercise.equipment
  const suffix = equipment ? ` (${equipment})` : ''

  return { setCount, suffix, exercise: entry.exercise }
}

export function WorkoutHistoryCard({
  workout,
  profile,
  allWorkouts = [],
  variant = 'standalone',
  className,
}: WorkoutHistoryCardProps) {
  const displayName = profile?.display_name ?? 'Athlète'
  const volumeKg = computeWorkoutVolume(workout)
  const recordsCount = countWorkoutPersonalRecords(workout, allWorkouts)
  const duration = formatWorkoutDuration(workout.started_at, workout.ended_at)
  const visibleExercises = workout.workout_exercises.slice(0, VISIBLE_EXERCISES)
  const hiddenCount = workout.workout_exercises.length - visibleExercises.length

  return (
    <div
      className={cn(
        'relative block w-full transition-colors',
        variant === 'standalone'
          ? 'rounded-2xl border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md'
          : 'w-full border-border px-4 py-3 pr-12 hover:bg-muted/20',
        className,
      )}
    >
      <div className="absolute right-3 top-3 z-10">
        <WorkoutDetailMenu workout={workout} compact />
      </div>

      <Link
        to="/app/workouts/$workoutId"
        params={{ workoutId: workout.id }}
        className="block w-full min-w-0"
      >
        <WorkoutSummaryHeader
          displayName={displayName}
          avatarUrl={profile?.avatar_url ?? null}
          startedAt={workout.started_at}
          title={workout.title}
          duration={duration}
          volumeKg={volumeKg}
          recordsCount={recordsCount}
          compact
        />

        {workout.workout_exercises.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {visibleExercises.map((entry) => {
              const summary = formatExerciseSummary(entry)

              return (
              <li
                key={entry.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-secondary">
                  <Dumbbell className="size-3.5 text-secondary" />
                </span>
                <span className="truncate">
                  {summary.setCount} série{summary.setCount > 1 ? 's' : ''} de{' '}
                  <DisplayExercise exercise={summary.exercise} />
                  {summary.suffix}
                </span>
              </li>
              )
            })}
            {hiddenCount > 0 ? (
              <li className="pl-9 text-xs text-muted-foreground">
                Afficher {hiddenCount} exercice{hiddenCount > 1 ? 's' : ''} de plus
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Dumbbell className="size-3" />
            {countWorkoutSets(workout)} sets
          </p>
        )}
      </Link>
    </div>
  )
}
