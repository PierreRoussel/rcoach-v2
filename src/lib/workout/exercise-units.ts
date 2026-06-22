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
  let index = 0

  while (index < exercises.length) {
    const supersetId = exercises[index]?.supersetId

    if (supersetId != null) {
      const indices = [index]
      let next = index + 1

      while (next < exercises.length && exercises[next]?.supersetId === supersetId) {
        indices.push(next)
        next += 1
      }

      if (indices.length > 1) {
        units.push({ type: 'superset', supersetId, indices })
        index = next
        continue
      }
    }

    units.push({ type: 'single', index })
    index += 1
  }

  return units
}
