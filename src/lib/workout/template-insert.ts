export function buildTemplateExerciseInsertObjects(
  templateId: string,
  exercises: Array<{
    exerciseId: string
    supersetId: number | null
    defaultRestSeconds: number
    sets: Array<{
      setIndex: number
      weightKg: number | null
      reps: number | null
      restSeconds: number
      usesGlobalRest: boolean
    }>
  }>,
  options?: { includeSupersetId?: boolean; includeDefaultRestSeconds?: boolean },
) {
  const includeSupersetId = options?.includeSupersetId ?? true
  const includeDefaultRestSeconds = options?.includeDefaultRestSeconds ?? true

  return exercises.map((exercise, sortOrder) => {
    const object: Record<string, unknown> = {
      template_id: templateId,
      exercise_id: exercise.exerciseId,
      sort_order: sortOrder,
      workout_template_sets: {
        data: exercise.sets.map((set) => ({
          set_index: set.setIndex,
          weight_kg: set.weightKg,
          reps: set.reps,
          rest_seconds: set.usesGlobalRest
            ? exercise.defaultRestSeconds
            : set.restSeconds,
        })),
      },
    }

    if (includeSupersetId && exercise.supersetId != null) {
      object.superset_id = exercise.supersetId
    }

    if (includeDefaultRestSeconds) {
      object.default_rest_seconds = exercise.defaultRestSeconds
    }

    return object
  })
}
