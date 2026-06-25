type ExerciseWithSuperset = {
  supersetId?: number | null
}

export function nextSupersetId(exercises: ExerciseWithSuperset[]): number {
  const ids = exercises
    .map((exercise) => exercise.supersetId)
    .filter((id): id is number => id != null)

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function getSupersetMemberIndices(
  exercises: ExerciseWithSuperset[],
  supersetId: number,
): number[] {
  return exercises
    .map((exercise, index) => (exercise.supersetId === supersetId ? index : -1))
    .filter((index) => index >= 0)
}

export function compactSupersetBlocks<T extends ExerciseWithSuperset>(
  exercises: T[],
): T[] {
  const supersetIds = [
    ...new Set(
      exercises
        .map((exercise) => exercise.supersetId)
        .filter((id): id is number => id != null),
    ),
  ].sort((left, right) => {
    const leftFirst = getSupersetMemberIndices(exercises, left)[0] ?? 0
    const rightFirst = getSupersetMemberIndices(exercises, right)[0] ?? 0
    return leftFirst - rightFirst
  })

  let result = [...exercises]

  for (const supersetId of supersetIds) {
    const memberIndices = getSupersetMemberIndices(result, supersetId)
    if (memberIndices.length < 2) {
      continue
    }

    const insertAt = result
      .slice(0, memberIndices[0])
      .filter((exercise) => exercise.supersetId !== supersetId).length
    const members = memberIndices.map((index) => result[index]!)
    const withoutMembers = result.filter(
      (exercise) => exercise.supersetId !== supersetId,
    )

    result = [
      ...withoutMembers.slice(0, insertAt),
      ...members,
      ...withoutMembers.slice(insertAt),
    ]
  }

  return result
}

function moveExerciseAdjacentToSuperset<T extends ExerciseWithSuperset>(
  exercises: T[],
  fromIndex: number,
  supersetId: number,
): T[] {
  const moving = exercises[fromIndex]
  if (!moving) {
    return exercises
  }

  const withoutMoving = exercises.filter((_, index) => index !== fromIndex)
  const memberIndices = getSupersetMemberIndices(withoutMoving, supersetId)

  if (memberIndices.length === 0) {
    return exercises
  }

  const insertAt = Math.max(...memberIndices) + 1
  const next = [...withoutMoving]
  next.splice(insertAt, 0, moving)
  return next
}

export function addExerciseToSuperset<T extends ExerciseWithSuperset>(
  exercises: T[],
  fromIndex: number,
  partnerIndex: number,
): T[] {
  if (fromIndex === partnerIndex) {
    return exercises
  }

  const partner = exercises[partnerIndex]
  const from = exercises[fromIndex]
  if (!partner || !from) {
    return exercises
  }

  const supersetId = partner.supersetId ?? nextSupersetId(exercises)
  if (from.supersetId === supersetId) {
    return compactSupersetBlocks(exercises)
  }

  const previousSupersetId = from.supersetId

  let next = exercises.map((exercise, index) => {
    if (index === fromIndex) {
      return { ...exercise, supersetId }
    }

    if (index === partnerIndex && partner.supersetId == null) {
      return { ...exercise, supersetId }
    }

    return exercise
  })

  next = moveExerciseAdjacentToSuperset(next, fromIndex, supersetId)
  next = compactSupersetBlocks(next)

  if (previousSupersetId != null && previousSupersetId !== supersetId) {
    next = cleanupSupersetAfterRemoval(next)
  }

  return next
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
