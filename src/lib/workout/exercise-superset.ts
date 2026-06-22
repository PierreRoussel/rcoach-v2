type ExerciseWithSuperset = {
  supersetId?: number | null
}

export function nextSupersetId(exercises: ExerciseWithSuperset[]): number {
  const ids = exercises
    .map((exercise) => exercise.supersetId)
    .filter((id): id is number => id != null)

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function addExerciseToSuperset<T extends ExerciseWithSuperset>(
  exercises: T[],
  fromIndex: number,
  partnerIndex: number,
): T[] {
  const partner = exercises[partnerIndex]
  if (!partner) {
    return exercises
  }

  const supersetId = partner.supersetId ?? nextSupersetId(exercises)

  return exercises.map((exercise, index) =>
    index === fromIndex || index === partnerIndex
      ? { ...exercise, supersetId }
      : exercise,
  )
}

export function removeExerciseFromSuperset<T extends ExerciseWithSuperset>(
  exercises: T[],
  index: number,
): T[] {
  const target = exercises[index]
  if (!target?.supersetId) {
    return exercises
  }

  const supersetId = target.supersetId
  const remaining = exercises.filter(
    (exercise, exerciseIndex) =>
      exerciseIndex !== index && exercise.supersetId === supersetId,
  )

  if (remaining.length <= 1) {
    return exercises.map((exercise) =>
      exercise.supersetId === supersetId
        ? { ...exercise, supersetId: null }
        : exercise,
    )
  }

  return exercises.map((exercise, exerciseIndex) =>
    exerciseIndex === index ? { ...exercise, supersetId: null } : exercise,
  )
}

export function cleanupSupersetAfterRemoval<T extends ExerciseWithSuperset>(
  exercises: T[],
): T[] {
  const counts = new Map<number, number>()

  for (const exercise of exercises) {
    if (exercise.supersetId != null) {
      counts.set(exercise.supersetId, (counts.get(exercise.supersetId) ?? 0) + 1)
    }
  }

  return exercises.map((exercise) => {
    if (
      exercise.supersetId != null &&
      (counts.get(exercise.supersetId) ?? 0) < 2
    ) {
      return { ...exercise, supersetId: null }
    }

    return exercise
  })
}
