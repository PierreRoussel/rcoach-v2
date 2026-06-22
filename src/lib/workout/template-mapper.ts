import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'

export function templateExercisesToActive(
  exercises: TemplateExerciseDraft[],
): ActiveExerciseEntry[] {
  return exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    supersetId: exercise.supersetId,
    sets: exercise.sets.map((set, index) => ({
      setIndex: index,
      setType: 'normal' as const,
      weightKg: set.weightKg,
      reps: set.reps,
      restSeconds: set.usesGlobalRest
        ? exercise.defaultRestSeconds
        : set.restSeconds,
    })),
  }))
}
