export function buildTemplateExerciseInsertObjects(
  templateId: string,
  exercises: Array<{
    exerciseId: string
    supersetId: number | null
    sets: Array<{
      setIndex: number
      weightKg: number | null
      reps: number | null
      restSeconds: number
      usesGlobalRest: boolean
    }>
  }>,
  defaultRestSeconds: number,
  options?: { includeSupersetId?: boolean },
) {
  const includeSupersetId = options?.includeSupersetId ?? true

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
          rest_seconds: set.usesGlobalRest ? defaultRestSeconds : set.restSeconds,
        })),
      },
    }

    if (includeSupersetId && exercise.supersetId != null) {
      object.superset_id = exercise.supersetId
    }

    return object
  })
}
