export function buildTemplateExerciseInsertObjects(
  templateId: string,
  exercises: Array<{
    exerciseId: string
    supersetId: number | null
    defaultRestSeconds: number
    sets: Array<{
      setIndex: number
      setType?: 'normal' | 'warmup' | 'failure'
      weightKg: number | null
      reps: number | null
      durationSeconds?: number | null
      restSeconds: number
      usesGlobalRest: boolean
    }>
  }>,
  options?: {
    includeSupersetId?: boolean
    includeDefaultRestSeconds?: boolean
    includeSetType?: boolean
  },
) {
  const includeSupersetId = options?.includeSupersetId ?? false
  const includeDefaultRestSeconds = options?.includeDefaultRestSeconds ?? false
  const includeSetType = options?.includeSetType ?? false

  return exercises.map((exercise, sortOrder) => {
    const object: Record<string, unknown> = {
      template_id: templateId,
      exercise_id: exercise.exerciseId,
      sort_order: sortOrder,
      workout_template_sets: {
        data: exercise.sets.map((set) => {
          const row: Record<string, unknown> = {
            set_index: set.setIndex,
            weight_kg: set.weightKg,
            reps: set.reps,
            rest_seconds: set.usesGlobalRest
              ? exercise.defaultRestSeconds
              : set.restSeconds,
          }

          if (set.durationSeconds != null) {
            row.duration_seconds = set.durationSeconds
          }

          if (includeSetType) {
            row.set_type = set.setType ?? 'normal'
          }

          return row
        }),
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
