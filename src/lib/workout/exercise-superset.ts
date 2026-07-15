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

export function addExerciseToSuperset<T extends ExerciseWithSuperset>(
  exercises: T[],
  fromIndex: number,
  partnerIndex: number,
): T[] {
  return applySupersetMembership(exercises, fromIndex, [partnerIndex])
}

export function getDefaultSupersetPartnerIndices(
  exercises: ExerciseWithSuperset[],
  anchorIndex: number,
): number[] {
  const anchor = exercises[anchorIndex]
  if (!anchor?.supersetId) {
    return []
  }

  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(
      ({ exercise, index }) =>
        index !== anchorIndex && exercise.supersetId === anchor.supersetId,
    )
    .map(({ index }) => index)
}

export function applySupersetMembership<T extends ExerciseWithSuperset>(
  exercises: T[],
  anchorIndex: number,
  selectedPartnerIndices: number[],
): T[] {
  const anchor = exercises[anchorIndex]
  if (!anchor) {
    return exercises
  }

  const partnerIndices = [
    ...new Set(
      selectedPartnerIndices.filter(
        (index) => index >= 0 && index < exercises.length && index !== anchorIndex,
      ),
    ),
  ]

  if (partnerIndices.length === 0) {
    if (anchor.supersetId == null) {
      return exercises
    }

    return cleanupSupersetAfterRemoval(
      removeExerciseFromSuperset(exercises, anchorIndex),
    )
  }

  let supersetId = anchor.supersetId ?? null
  if (supersetId == null) {
    for (const partnerIndex of partnerIndices) {
      const partner = exercises[partnerIndex]
      if (partner?.supersetId != null) {
        supersetId = partner.supersetId
        break
      }
    }
  }
  if (supersetId == null) {
    supersetId = nextSupersetId(exercises)
  }

  const memberIndices = new Set([anchorIndex, ...partnerIndices])

  let next = exercises.map((exercise, index) => {
    if (memberIndices.has(index)) {
      return { ...exercise, supersetId }
    }

    if (anchor.supersetId != null && exercise.supersetId === anchor.supersetId) {
      return { ...exercise, supersetId: null }
    }

    return exercise
  })

  next = cleanupSupersetAfterRemoval(next)
  return compactSupersetBlocks(next)
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
