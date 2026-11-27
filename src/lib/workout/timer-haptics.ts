import { Capacitor } from '@capacitor/core'

import { playRestCompleteBeep } from '@/lib/workout/rest-timer-audio'

/** Align EMOM `countdown_complete` / rest natural end. */
export const HAPTIC_COMPLETE_PATTERN = [50, 40, 50] as const

/** Soft tick (EMOM countdown / rest 3-2-1). */
export const HAPTIC_SOFT_TICK_MS = 35

function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function vibrateWeb(pattern: number | readonly number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern as number | number[])
  }
}

async function vibrateNativeSequence(pattern: readonly number[]) {
  const { Haptics } = await import('@capacitor/haptics')
  for (let i = 0; i < pattern.length; i += 1) {
    const ms = pattern[i] ?? 0
    if (i % 2 === 0) {
      if (ms > 0) {
        await Haptics.vibrate({ duration: ms })
      }
    } else if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms))
    }
  }
}

/**
 * Phone/web haptic. Native Android → `@capacitor/haptics` (dyn).
 * Web / failure → `navigator.vibrate` if present, else no-op.
 */
export async function vibrate(pattern: number | readonly number[]) {
  try {
    if (isAndroidNative()) {
      const sequence = typeof pattern === 'number' ? [pattern] : pattern
      await vibrateNativeSequence(sequence)
      return
    }
    vibrateWeb(pattern)
  } catch {
    vibrateWeb(pattern)
  }
}

export function vibrateSoftTick() {
  void vibrate(HAPTIC_SOFT_TICK_MS)
}

/** Fin naturelle du repos : beep + double pulse. */
export function notifyRestComplete() {
  void playRestCompleteBeep()
  void vibrate(HAPTIC_COMPLETE_PATTERN)
}

/** Soft haptic pendant countdown 3-2-1 (beep géré à part). */
export function notifyRestCountdownTick(_secondsLeft: number) {
  vibrateSoftTick()
}
