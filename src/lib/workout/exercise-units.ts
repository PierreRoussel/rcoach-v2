export type ExerciseUnit =
  | { type: 'single'; index: number }
  | { type: 'superset'; supersetId: number; indices: number[] }

type ExerciseWithSuperset = {
  supersetId?: number | null
}

export function buildExerciseUnits<T extends ExerciseWithSuperset>(
  exercises: T[],
): ExerciseUnit[] {
  const units: ExerciseUnit[] = []
  const processed = new Set<number>()

  for (let index = 0; index < exercises.length; index += 1) {
    if (processed.has(index)) {
      continue
    }

    const supersetId = exercises[index]?.supersetId

    if (supersetId != null) {
      const indices = exercises
        .map((exercise, exerciseIndex) =>
          exercise.supersetId === supersetId ? exerciseIndex : -1,
        )
        .filter((exerciseIndex) => exerciseIndex >= 0)

      if (indices.length > 1) {
        for (const memberIndex of indices) {
          processed.add(memberIndex)
        }

        units.push({ type: 'superset', supersetId, indices })
        continue
      }
    }

    processed.add(index)
    units.push({ type: 'single', index })
  }

  return units
}
