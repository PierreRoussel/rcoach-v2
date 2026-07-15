import type { EmomMinuteLog } from '@/lib/workout/emom-circuit'
import { isEmomComplete } from '@/lib/workout/emom-circuit'

export type EmomPhase = 'countdown' | 'minute' | 'complete'

export type EmomTimerState = {
  intervalSeconds: number
  totalMinutes: number
  startedAtMs: number
  phase: EmomPhase
  countdownSecondsLeft: number | null
  currentMinuteIndex: number
  secondsLeftInMinute: number
  emomEndsAt: number | null
  minuteLogs: Record<number, EmomMinuteLog>
}

export type EmomTickEvent =
  | { type: 'countdown_tick'; secondsLeft: number }
  | { type: 'countdown_complete' }
  | { type: 'minute_start'; minuteIndex: number }
  | { type: 'workout_complete' }

export const DEFAULT_EMOM_COUNTDOWN_SECONDS = 3

export function createInitialEmomState(
  intervalSeconds: number,
  totalMinutes: number,
  options?: {
    nowMs?: number
    countdownSeconds?: number
  },
): EmomTimerState {
  const nowMs = options?.nowMs ?? Date.now()
  const normalizedInterval = Math.max(1, Math.round(intervalSeconds))
  const normalizedTotalMinutes = Math.max(1, Math.round(totalMinutes))
  const countdownSeconds = Math.max(0, Math.round(options?.countdownSeconds ?? DEFAULT_EMOM_COUNTDOWN_SECONDS))

  const base = {
    intervalSeconds: normalizedInterval,
    totalMinutes: normalizedTotalMinutes,
    startedAtMs: nowMs,
    currentMinuteIndex: 0,
    minuteLogs: {} as Record<number, EmomMinuteLog>,
  }

  if (countdownSeconds > 0) {
    return {
      ...base,
      phase: 'countdown',
      countdownSecondsLeft: countdownSeconds,
      secondsLeftInMinute: 0,
      emomEndsAt: nowMs + countdownSeconds * 1_000,
    }
  }

  return {
    ...base,
    phase: 'minute',
    countdownSecondsLeft: null,
    secondsLeftInMinute: normalizedInterval,
    emomEndsAt: nowMs + normalizedInterval * 1_000,
  }
}

export function syncEmomSecondsLeft(emomEndsAt: number | null, nowMs = Date.now()): number {
  if (emomEndsAt == null) {
    return 0
  }

  return Math.max(0, Math.ceil((emomEndsAt - nowMs) / 1_000))
}

export function isEmomTimerRunning(state: EmomTimerState): boolean {
  return state.phase !== 'complete' && state.emomEndsAt != null
}

function startMinutePhase(
  state: EmomTimerState,
  minuteIndex: number,
  nowMs: number,
): EmomTimerState {
  if (isEmomComplete(minuteIndex, state.totalMinutes)) {
    return {
      ...state,
      phase: 'complete',
      currentMinuteIndex: minuteIndex,
      countdownSecondsLeft: null,
      secondsLeftInMinute: 0,
      emomEndsAt: null,
    }
  }

  return {
    ...state,
    phase: 'minute',
    countdownSecondsLeft: null,
    currentMinuteIndex: minuteIndex,
    secondsLeftInMinute: state.intervalSeconds,
    emomEndsAt: nowMs + state.intervalSeconds * 1_000,
  }
}

export function tickEmomState(
  state: EmomTimerState,
  nowMs = Date.now(),
): { state: EmomTimerState; events: EmomTickEvent[] } {
  const events: EmomTickEvent[] = []

  if (state.phase === 'complete' || isEmomComplete(state.currentMinuteIndex, state.totalMinutes)) {
    return {
      state: {
        ...state,
        phase: 'complete',
        secondsLeftInMinute: 0,
        emomEndsAt: null,
        countdownSecondsLeft: null,
      },
      events: state.phase === 'complete' ? [] : [{ type: 'workout_complete' }],
    }
  }

  const secondsLeft = syncEmomSecondsLeft(state.emomEndsAt, nowMs)

  if (state.phase === 'countdown') {
    if (secondsLeft > 0) {
      if (secondsLeft !== state.countdownSecondsLeft) {
        events.push({ type: 'countdown_tick', secondsLeft })
      }

      return {
        state: {
          ...state,
          countdownSecondsLeft: secondsLeft,
        },
        events,
      }
    }

    events.push({ type: 'countdown_complete' })
    events.push({ type: 'minute_start', minuteIndex: 0 })

    return {
      state: startMinutePhase(state, 0, nowMs),
      events,
    }
  }

  if (secondsLeft > 0) {
    return {
      state: {
        ...state,
        secondsLeftInMinute: secondsLeft,
      },
      events,
    }
  }

  const nextMinuteIndex = state.currentMinuteIndex + 1
  if (isEmomComplete(nextMinuteIndex, state.totalMinutes)) {
    events.push({ type: 'workout_complete' })
    return {
      state: {
        ...state,
        phase: 'complete',
        currentMinuteIndex: nextMinuteIndex,
        secondsLeftInMinute: 0,
        emomEndsAt: null,
      },
      events,
    }
  }

  events.push({ type: 'minute_start', minuteIndex: nextMinuteIndex })

  return {
    state: startMinutePhase(state, nextMinuteIndex, nowMs),
    events,
  }
}

export function logEmomMinuteState(
  state: EmomTimerState,
  minuteIndex: number,
  loggedAt: string,
): EmomTimerState {
  if (state.phase === 'countdown') {
    return state
  }

  return {
    ...state,
    minuteLogs: {
      ...state.minuteLogs,
      [minuteIndex]: { loggedAt },
    },
  }
}

export function skipToNextMinuteState(
  state: EmomTimerState,
  nowMs = Date.now(),
): { state: EmomTimerState; events: EmomTickEvent[] } {
  if (state.phase === 'countdown') {
    return tickEmomState(
      {
        ...state,
        emomEndsAt: nowMs,
        countdownSecondsLeft: 0,
      },
      nowMs,
    )
  }

  const nextMinuteIndex = state.currentMinuteIndex + 1
  if (isEmomComplete(nextMinuteIndex, state.totalMinutes)) {
    return tickEmomState(
      {
        ...state,
        emomEndsAt: nowMs,
        secondsLeftInMinute: 0,
      },
      nowMs,
    )
  }

  return {
    state: startMinutePhase(state, nextMinuteIndex, nowMs),
    events: [{ type: 'minute_start', minuteIndex: nextMinuteIndex }],
  }
}

export function normalizeEmomState(
  state: Partial<EmomTimerState> & Pick<EmomTimerState, 'intervalSeconds' | 'totalMinutes' | 'startedAtMs' | 'currentMinuteIndex' | 'secondsLeftInMinute' | 'emomEndsAt' | 'minuteLogs'>,
): EmomTimerState {
  if (state.phase) {
    return state as EmomTimerState
  }

  const complete = isEmomComplete(state.currentMinuteIndex, state.totalMinutes)

  return {
    ...state,
    phase: complete ? 'complete' : 'minute',
    countdownSecondsLeft: null,
  }
}

export function countLoggedEmomMinutes(state: EmomTimerState): number {
  return Object.keys(state.minuteLogs).length
}
