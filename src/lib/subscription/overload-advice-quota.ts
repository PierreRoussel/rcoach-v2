import { format } from 'date-fns'

const STORAGE_PREFIX = 'overload-advice-free'

export type FreeOverloadAdviceState = {
  dateKey: string
  used: boolean
  exerciseId: string | null
}

function toDateKey(date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

function storageKey(userId: string, dateKey: string): string {
  return `${STORAGE_PREFIX}:${userId}:${dateKey}`
}

function readState(userId: string, dateKey: string): FreeOverloadAdviceState {
  if (typeof localStorage === 'undefined') {
    return { dateKey, used: false, exerciseId: null }
  }

  try {
    const raw = localStorage.getItem(storageKey(userId, dateKey))
    if (!raw) {
      return { dateKey, used: false, exerciseId: null }
    }

    const parsed = JSON.parse(raw) as Partial<FreeOverloadAdviceState>
    return {
      dateKey,
      used: Boolean(parsed.used),
      exerciseId: typeof parsed.exerciseId === 'string' ? parsed.exerciseId : null,
    }
  } catch {
    return { dateKey, used: false, exerciseId: null }
  }
}

function writeState(userId: string, state: FreeOverloadAdviceState): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(storageKey(userId, state.dateKey), JSON.stringify(state))
}

function hashSeed(input: string): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

export function pickDailyOverloadExerciseId(
  userId: string,
  dateKey: string,
  exerciseIds: string[],
): string | null {
  if (exerciseIds.length === 0) {
    return null
  }

  const seed = `${userId}:${dateKey}`
  const index = hashSeed(seed) % exerciseIds.length
  return exerciseIds[index] ?? null
}

export function getFreeOverloadAdviceState(
  userId: string,
  date = new Date(),
): FreeOverloadAdviceState {
  const dateKey = toDateKey(date)
  return readState(userId, dateKey)
}

export function markFreeOverloadAdviceUsed(
  userId: string,
  exerciseId: string,
  date = new Date(),
): FreeOverloadAdviceState {
  const dateKey = toDateKey(date)
  const nextState: FreeOverloadAdviceState = {
    dateKey,
    used: true,
    exerciseId,
  }
  writeState(userId, nextState)
  return nextState
}

export function resolveDailyOverloadExerciseId(
  userId: string,
  exerciseIds: string[],
  date = new Date(),
): string | null {
  const dateKey = toDateKey(date)
  const state = readState(userId, dateKey)

  if (state.exerciseId && exerciseIds.includes(state.exerciseId)) {
    return state.exerciseId
  }

  const picked = pickDailyOverloadExerciseId(userId, dateKey, exerciseIds)
  if (!picked) {
    return null
  }

  if (!state.used) {
    writeState(userId, { dateKey, used: false, exerciseId: picked })
  }

  return picked
}

export function canApplyFreeOverloadAdvice(
  userId: string,
  exerciseId: string,
  date = new Date(),
): boolean {
  const dateKey = toDateKey(date)
  const state = readState(userId, dateKey)
  const dailyExerciseId = resolveDailyOverloadExerciseId(userId, [exerciseId], date)

  if (dailyExerciseId !== exerciseId) {
    return false
  }

  return !state.used
}
