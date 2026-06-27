import { useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import type { ExerciseCatalogEntry } from '@/lib/stats/exercise-progression'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import { cn } from '@/lib/utils'

type ExerciseCatalogListProps = {
  exercises: ExerciseCatalogEntry[]
  limit?: number
  className?: string
}

export function ExerciseCatalogList({
  exercises,
  limit = 8,
  className,
}: ExerciseCatalogListProps) {
  const navigate = useNavigate()
  const visible = exercises.slice(0, limit)

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun exercice enregistré pour le moment.
      </p>
    )
  }

  return (
    <ul className={cn('divide-y divide-border/70 rounded-2xl border border-border', className)}>
      {visible.map((entry) => {
        const muscleLabel =
          MUSCLE_GROUP_LABELS[normalizeMuscleGroup(entry.muscleGroup)]

        return (
          <li key={entry.exerciseId}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              onClick={() =>
                void navigate({
                  to: '/app/stats/exercises/$exerciseId',
                  params: { exerciseId: entry.exerciseId },
                })
              }
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-bold">
                  <DisplayExerciseName
                    name={entry.name}
                    nameFr={entry.nameFr}
                    exerciseId={entry.exerciseId}
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  {muscleLabel} · {entry.sessionCount} séance
                  {entry.sessionCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="min-w-0 shrink text-right">
                <p className="truncate font-data text-xs font-medium text-foreground">
                  {entry.currentPerformance ?? '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">dernière perf.</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
