import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import { DEFAULT_GLOBAL_REST_SECONDS } from '@/hooks/useWorkoutTemplates'
import type { WorkoutDetail, WorkoutSummary } from '@/lib/graphql/operations'

export function workoutToTemplateExercises(
  workout: WorkoutDetail | WorkoutSummary,
  defaultRestSeconds = DEFAULT_GLOBAL_REST_SECONDS,
): TemplateExerciseDraft[] {
  return workout.workout_exercises.map((entry) => ({
    exerciseId: entry.exercise.id,
    exerciseName: entry.exercise.name,
    muscleGroup: entry.exercise.muscle_group,
    equipment: entry.exercise.equipment,
    supersetId: null,
    sets: entry.sets.map((set) => ({
      setIndex: set.set_index,
      weightKg: set.weight_kg,
      reps: set.reps,
      restSeconds: defaultRestSeconds,
      usesGlobalRest: true,
    })),
  }))
}
