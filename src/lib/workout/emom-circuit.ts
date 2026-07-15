import type { ActiveExerciseDraft } from '@/lib/db/dexie'

export type EmomSlot =
  | { type: 'single'; exerciseIndex: number }
  | { type: 'group'; emomGroupId: number; exerciseIndices: number[] }

export type EmomExercise = ActiveExerciseDraft & {
  targetReps?: number | null
  emomGroupId?: number | null
}

export type EmomMinuteLog = {
  loggedAt: string
}

type ExerciseWithEmomGroup = {
  emomGroupId?: number | null
}

export function buildEmomSlots<T extends ExerciseWithEmomGroup>(
  exercises: T[],
): EmomSlot[] {
  const slots: EmomSlot[] = []
  const processed = new Set<number>()

  for (let index = 0; index < exercises.length; index += 1) {
    if (processed.has(index)) {
      continue
    }

    const emomGroupId = exercises[index]?.emomGroupId

    if (emomGroupId != null) {
      const exerciseIndices = exercises
        .map((exercise, exerciseIndex) =>
          exercise.emomGroupId === emomGroupId ? exerciseIndex : -1,
        )
        .filter((exerciseIndex) => exerciseIndex >= 0)

      if (exerciseIndices.length > 1) {
        for (const memberIndex of exerciseIndices) {
          processed.add(memberIndex)
        }

        slots.push({ type: 'group', emomGroupId, exerciseIndices })
        continue
      }
    }

    processed.add(index)
    slots.push({ type: 'single', exerciseIndex: index })
  }

  return slots
}

export function getSlotForMinute(slots: EmomSlot[], minuteIndex: number): EmomSlot | null {
  if (slots.length === 0) {
    return null
  }

  const normalized = Math.max(0, Math.floor(minuteIndex))
  return slots[normalized % slots.length] ?? null
}

export function getSlotExerciseIndices(slot: EmomSlot | null): number[] {
  if (!slot) {
    return []
  }

  return slot.type === 'single' ? [slot.exerciseIndex] : slot.exerciseIndices
}

export function isEmomComplete(currentMinuteIndex: number, totalMinutes: number): boolean {
  return currentMinuteIndex >= totalMinutes
}

export function formatEmomSecondsLeft(seconds: number): string {
  const normalized = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(normalized / 60)
  const remainingSeconds = normalized % 60

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return `0:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getEmomExercisesForSync(
  exercises: EmomExercise[],
  minuteLogs: Record<number, EmomMinuteLog>,
  slots: EmomSlot[],
) {
  const setsByExerciseIndex = new Map<number, EmomExercise['sets']>()

  for (const [minuteKey, log] of Object.entries(minuteLogs)) {
    const minuteIndex = Number(minuteKey)
    if (!Number.isFinite(minuteIndex)) {
      continue
    }

    const slot = getSlotForMinute(slots, minuteIndex)
    for (const exerciseIndex of getSlotExerciseIndices(slot)) {
      const exercise = exercises[exerciseIndex]
      if (!exercise) {
        continue
      }

      const existing = setsByExerciseIndex.get(exerciseIndex) ?? []
      setsByExerciseIndex.set(exerciseIndex, [
        ...existing,
        {
          setIndex: existing.length,
          setType: 'normal' as const,
          weightKg: null,
          reps: exercise.targetReps ?? null,
          completedAt: log.loggedAt,
        },
      ])
    }
  }

  return exercises
    .map((exercise, exerciseIndex) => ({
      ...exercise,
      sets: (setsByExerciseIndex.get(exerciseIndex) ?? []).map((set, setIndex) => ({
        ...set,
        setIndex,
      })),
    }))
    .filter((exercise) => exercise.sets.length > 0)
}
