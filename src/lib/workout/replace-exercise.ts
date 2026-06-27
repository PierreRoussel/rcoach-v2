import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

export type ReplaceExerciseSelection = {
  id: string
  name: string
  name_fr?: string | null
  muscle_group?: string | null
  equipment?: string | null
}

export function replaceActiveExercise(
  current: ActiveExerciseEntry,
  exercise: ReplaceExerciseSelection,
): ActiveExerciseEntry {
  return {
    ...current,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseNameFr: exercise.name_fr ?? null,
    muscleGroup: exercise.muscle_group ?? null,
    equipment: exercise.equipment ?? null,
    sets: current.sets.map((set) => ({
      ...set,
      completedAt: null,
    })),
  }
}

export function replaceTemplateExercise(
  current: TemplateExerciseDraft,
  exercise: ReplaceExerciseSelection,
): TemplateExerciseDraft {
  return {
    ...current,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseNameFr: exercise.name_fr ?? null,
    muscleGroup: exercise.muscle_group ?? null,
    equipment: exercise.equipment ?? null,
  }
}
