import { format, formatDistanceStrict } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Dumbbell } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill } from '@/design-system'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import type { WorkoutDetail } from '@/lib/graphql/operations'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

type WorkoutDetailContentProps = {
  workout: WorkoutDetail
  authorName?: string | null
}

export function WorkoutDetailContent({
  workout,
  authorName,
}: WorkoutDetailContentProps) {
  const duration =
    workout.ended_at != null
      ? formatDistanceStrict(
          new Date(workout.started_at),
          new Date(workout.ended_at),
          { locale: fr },
        )
      : null

  const dateLabel = duration
    ? `${format(new Date(workout.started_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })} · ${duration}`
    : format(new Date(workout.started_at), "d MMMM yyyy 'a' HH:mm", {
        locale: fr,
      })

  return (
    <>
      {authorName ? (
        <p className="text-sm text-muted-foreground">
          Partage par {authorName}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">{dateLabel}</p>

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
    </>
  )
}
