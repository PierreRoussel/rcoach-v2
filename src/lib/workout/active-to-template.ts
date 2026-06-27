import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

export function activeExercisesToTemplateDrafts(
  exercises: ActiveExerciseEntry[],
  defaultRestSeconds: number,
): TemplateExerciseDraft[] {
  return exercises.map((exercise) => {
    const exerciseDefaultRest = exercise.defaultRestSeconds ?? defaultRestSeconds
    const sets =
      exercise.sets.length > 0
        ? exercise.sets.map((set, index) => {
            const restSeconds = set.restSeconds ?? exerciseDefaultRest
            return {
              setIndex: index,
              setType: set.setType ?? 'normal',
              weightKg: set.weightKg,
              reps: set.reps,
              durationSeconds: set.durationSeconds ?? null,
              restSeconds,
              usesGlobalRest: restSeconds === exerciseDefaultRest,
            }
          })
        : [
            {
              setIndex: 0,
              setType: 'normal' as const,
              weightKg: null,
              reps: null,
              durationSeconds: null,
              restSeconds: exerciseDefaultRest,
              usesGlobalRest: true,
            },
          ]

    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      exerciseNameFr: exercise.exerciseNameFr ?? null,
      muscleGroup: exercise.muscleGroup ?? null,
      equipment: exercise.equipment ?? null,
      supersetId: exercise.supersetId ?? null,
      defaultRestSeconds: exerciseDefaultRest,
      sets,
    }
  })
}
