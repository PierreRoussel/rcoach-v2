import type { Exercise } from '@/lib/graphql/operations'
import type { OverloadSuggestion } from '@/lib/workout/progressive-overload'

import { ExerciseOverloadHint } from '@/components/workout/ExerciseOverloadHint'

type ExercisePerformancePanelProps = {
  exercise: Pick<Exercise, 'id' | 'name' | 'equipment' | 'muscle_group'>
  onApplySuggestion?: (suggestion: OverloadSuggestion) => void
}

export function ExercisePerformancePanel({
  exercise,
  onApplySuggestion,
}: ExercisePerformancePanelProps) {
  return (
    <ExerciseOverloadHint
      exercise={exercise}
      onApply={onApplySuggestion}
    />
  )
}
