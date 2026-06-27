import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import { DEFAULT_GLOBAL_REST_SECONDS } from '@/hooks/useWorkoutTemplates'
import type { WorkoutDetail, WorkoutSummary } from '@/lib/graphql/operations'

const MAX_TEMPLATE_WEIGHT_KG = 9999.99

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toRepsOrNull(value: unknown): number | null {
  const parsed = toNumberOrNull(value)
  if (parsed == null) {
    return null
  }

  return Math.max(0, Math.round(parsed))
}

function toWeightOrNull(value: unknown): number | null {
  const parsed = toNumberOrNull(value)
  if (parsed == null) {
    return null
  }

  return Math.min(MAX_TEMPLATE_WEIGHT_KG, Math.max(0, Math.round(parsed * 100) / 100))
}

export function workoutToTemplateExercises(
  workout: WorkoutDetail | WorkoutSummary,
  defaultRestSeconds = DEFAULT_GLOBAL_REST_SECONDS,
): TemplateExerciseDraft[] {
  return workout.workout_exercises
    .map((entry) => {
      const sortedSets = [...entry.sets].sort((left, right) => left.set_index - right.set_index)
      const sets =
        sortedSets.length > 0
          ? sortedSets.map((set, index) => ({
              setIndex: index,
              weightKg: toWeightOrNull(set.weight_kg),
              reps: toRepsOrNull(set.reps),
              restSeconds: defaultRestSeconds,
              usesGlobalRest: true,
            }))
          : [
              {
                setIndex: 0,
                weightKg: null,
                reps: null,
                restSeconds: defaultRestSeconds,
                usesGlobalRest: true,
              },
            ]

      return {
        exerciseId: entry.exercise.id,
        exerciseName: entry.exercise.name,
        exerciseNameFr: entry.exercise.name_fr ?? null,
        muscleGroup: entry.exercise.muscle_group,
        equipment: entry.exercise.equipment,
        supersetId: null,
        defaultRestSeconds,
        sets,
      }
    })
    .filter((exercise) => Boolean(exercise.exerciseId))
}
