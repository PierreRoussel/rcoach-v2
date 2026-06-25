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
    defaultRestSeconds: exercise.defaultRestSeconds,
    sets: exercise.sets.map((set, index) => ({
      setIndex: index,
      setType: set.setType ?? 'normal',
      weightKg: set.weightKg,
      reps: set.reps,
      durationSeconds: set.durationSeconds ?? null,
      restSeconds: set.usesGlobalRest
        ? exercise.defaultRestSeconds
        : set.restSeconds,
      completedAt: null,
    })),
  }))
}
