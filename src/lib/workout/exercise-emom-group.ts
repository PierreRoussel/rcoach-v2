type ExerciseWithEmomGroup = {
  emomGroupId?: number | null
}

export function nextEmomGroupId(exercises: ExerciseWithEmomGroup[]): number {
  const ids = exercises
    .map((exercise) => exercise.emomGroupId)
    .filter((id): id is number => id != null)

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function getEmomGroupMemberIndices(
  exercises: ExerciseWithEmomGroup[],
  emomGroupId: number,
): number[] {
  return exercises
    .map((exercise, index) => (exercise.emomGroupId === emomGroupId ? index : -1))
    .filter((index) => index >= 0)
}

export function compactEmomGroupBlocks<T extends ExerciseWithEmomGroup>(
  exercises: T[],
): T[] {
  const groupIds = [
    ...new Set(
      exercises
        .map((exercise) => exercise.emomGroupId)
        .filter((id): id is number => id != null),
    ),
  ].sort((left, right) => {
    const leftFirst = getEmomGroupMemberIndices(exercises, left)[0] ?? 0
    const rightFirst = getEmomGroupMemberIndices(exercises, right)[0] ?? 0
    return leftFirst - rightFirst
  })

  let result = [...exercises]

  for (const emomGroupId of groupIds) {
    const memberIndices = getEmomGroupMemberIndices(result, emomGroupId)
    if (memberIndices.length < 2) {
      continue
    }

    const insertAt = result
      .slice(0, memberIndices[0])
      .filter((exercise) => exercise.emomGroupId !== emomGroupId).length
    const members = memberIndices.map((index) => result[index]!)
    const withoutMembers = result.filter(
      (exercise) => exercise.emomGroupId !== emomGroupId,
    )

    result = [
      ...withoutMembers.slice(0, insertAt),
      ...members,
      ...withoutMembers.slice(insertAt),
    ]
  }

  return result
}

export function getDefaultEmomGroupPartnerIndices(
  exercises: ExerciseWithEmomGroup[],
  anchorIndex: number,
): number[] {
  const anchor = exercises[anchorIndex]
  if (!anchor?.emomGroupId) {
    return []
  }

  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(
      ({ exercise, index }) =>
        index !== anchorIndex && exercise.emomGroupId === anchor.emomGroupId,
    )
    .map(({ index }) => index)
}

export function applyEmomGroupMembership<T extends ExerciseWithEmomGroup>(
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
    if (anchor.emomGroupId == null) {
      return exercises
    }

    return cleanupEmomGroupAfterRemoval(
      removeExerciseFromEmomGroup(exercises, anchorIndex),
    )
  }

  let emomGroupId = anchor.emomGroupId ?? null
  if (emomGroupId == null) {
    for (const partnerIndex of partnerIndices) {
      const partner = exercises[partnerIndex]
      if (partner?.emomGroupId != null) {
        emomGroupId = partner.emomGroupId
        break
      }
    }
  }
  if (emomGroupId == null) {
    emomGroupId = nextEmomGroupId(exercises)
  }

  const memberIndices = new Set([anchorIndex, ...partnerIndices])

  let next = exercises.map((exercise, index) => {
    if (memberIndices.has(index)) {
      return { ...exercise, emomGroupId }
    }

    if (anchor.emomGroupId != null && exercise.emomGroupId === anchor.emomGroupId) {
      return { ...exercise, emomGroupId: null }
    }

    return exercise
  })

  next = cleanupEmomGroupAfterRemoval(next)
  return compactEmomGroupBlocks(next)
}

export function removeExerciseFromEmomGroup<T extends ExerciseWithEmomGroup>(
  exercises: T[],
  index: number,
): T[] {
  const target = exercises[index]
  if (!target?.emomGroupId) {
    return exercises
  }

  const emomGroupId = target.emomGroupId
  const remaining = exercises.filter(
    (exercise, exerciseIndex) =>
      exerciseIndex !== index && exercise.emomGroupId === emomGroupId,
  )

  if (remaining.length <= 1) {
    return exercises.map((exercise) =>
      exercise.emomGroupId === emomGroupId
        ? { ...exercise, emomGroupId: null }
        : exercise,
    )
  }

  return exercises.map((exercise, exerciseIndex) =>
    exerciseIndex === index ? { ...exercise, emomGroupId: null } : exercise,
  )
}

export function cleanupEmomGroupAfterRemoval<T extends ExerciseWithEmomGroup>(
  exercises: T[],
): T[] {
  const counts = new Map<number, number>()

  for (const exercise of exercises) {
    if (exercise.emomGroupId != null) {
      counts.set(exercise.emomGroupId, (counts.get(exercise.emomGroupId) ?? 0) + 1)
    }
  }

  return exercises.map((exercise) => {
    if (
      exercise.emomGroupId != null &&
      (counts.get(exercise.emomGroupId) ?? 0) < 2
    ) {
      return { ...exercise, emomGroupId: null }
    }

    return exercise
  })
}
