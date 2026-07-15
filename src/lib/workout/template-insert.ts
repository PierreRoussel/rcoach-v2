export function buildTemplateExerciseInsertObjects(
  templateId: string,
  exercises: Array<{
    exerciseId: string
    supersetId: number | null
    emomGroupId?: number | null
    targetReps?: number | null
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
    includeEmomGroupId?: boolean
    includeTargetReps?: boolean
    includeDefaultRestSeconds?: boolean
    includeSetType?: boolean
  },
) {
  const includeSupersetId = options?.includeSupersetId ?? false
  const includeEmomGroupId = options?.includeEmomGroupId ?? false
  const includeTargetReps = options?.includeTargetReps ?? false
  const includeDefaultRestSeconds = options?.includeDefaultRestSeconds ?? false
  const includeSetType = options?.includeSetType ?? false

  return exercises.map((exercise, sortOrder) => {
    const setRows = exercise.sets.map((set) => {
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
    })

    const object: Record<string, unknown> = {
      template_id: templateId,
      exercise_id: exercise.exerciseId,
      sort_order: sortOrder,
    }

    if (setRows.length > 0) {
      object.workout_template_sets = { data: setRows }
    }

    if (includeSupersetId && exercise.supersetId != null) {
      object.superset_id = exercise.supersetId
    }

    if (includeEmomGroupId && exercise.emomGroupId != null) {
      object.emom_group_id = exercise.emomGroupId
    }

    if (includeTargetReps && exercise.targetReps != null) {
      object.target_reps = exercise.targetReps
    }

    if (includeDefaultRestSeconds) {
      object.default_rest_seconds = exercise.defaultRestSeconds
    }

    return object
  })
}
