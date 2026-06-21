import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'

import { Pill } from '@/design-system'
import { useLastExercisePerformance } from '@/hooks/useExercises'
import type { Exercise } from '@/lib/graphql/operations'
import {
  suggestProgressiveOverload,
  type OverloadSuggestion,
} from '@/lib/workout/progressive-overload'

type ExercisePerformancePanelProps = {
  exercise: Pick<Exercise, 'id' | 'name' | 'equipment'>
  onApplySuggestion?: (suggestion: OverloadSuggestion) => void
}

export function ExercisePerformancePanel({
  exercise,
  onApplySuggestion,
}: ExercisePerformancePanelProps) {
  const { data: lastPerformance, isLoading } = useLastExercisePerformance(exercise.id)

  const suggestion = lastPerformance
    ? suggestProgressiveOverload(exercise, lastPerformance)
    : null

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Chargement historique...</p>
  }

  if (!lastPerformance?.bestSet) {
    return (
      <p className="text-xs text-muted-foreground">
        Premiere fois sur cet exercice — loggez votre set de reference.
      </p>
    )
  }

  const best = lastPerformance.bestSet
  const dateLabel = format(new Date(lastPerformance.date), 'd MMM yyyy', { locale: fr })

  return (
    <div className="space-y-2 rounded-2xl bg-soft-secondary/50 p-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-secondary-foreground" />
        <p className="text-xs font-semibold text-foreground">Seance precedente ({dateLabel})</p>
      </div>
      <p className="font-data text-xs text-muted-foreground">
        {best.weight_kg != null ? `${best.weight_kg} kg x ` : ''}
        {best.reps != null ? `${best.reps} reps` : ''}
        {best.duration_seconds != null ? `${best.duration_seconds}s` : ''}
        {best.distance_km != null ? `${best.distance_km} km` : ''}
      </p>
      {suggestion ? (
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">{suggestion.message}</Pill>
          {onApplySuggestion ? (
            <button
              type="button"
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => onApplySuggestion(suggestion)}
            >
              Appliquer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
