import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { useIntervalWhenVisible } from '@/hooks/useIntervalWhenVisible'
import { useRestTimerAudio } from '@/hooks/useRestTimerAudio'
import { isEmomTimerRunning } from '@/lib/workout/emom-store'

const TIMER_TICK_MS = 1_000

/** Keeps rest/hold timers and audio isolated from the main workout page tree. */
export function ActiveWorkoutTimerDrivers() {
  const sessionMode = useActiveWorkoutStore((state) => state.sessionMode)
  const isResting = useActiveWorkoutStore((state) => state.isResting)
  const isHolding = useActiveWorkoutStore((state) => state.isHolding)
  const restSecondsLeft = useActiveWorkoutStore((state) => state.restSecondsLeft)
  const emom = useActiveWorkoutStore((state) => state.emom)
  const tickRest = useActiveWorkoutStore((state) => state.tickRest)
  const tickHold = useActiveWorkoutStore((state) => state.tickHold)
  const tickEmom = useActiveWorkoutStore((state) => state.tickEmom)

  useIntervalWhenVisible(tickRest, isResting ? TIMER_TICK_MS : null)
  useIntervalWhenVisible(tickHold, isHolding ? TIMER_TICK_MS : null)
  useIntervalWhenVisible(
    tickEmom,
    sessionMode === 'emom' && emom && isEmomTimerRunning(emom) ? TIMER_TICK_MS : null,
  )
  useRestTimerAudio(isResting, restSecondsLeft)

  return null
}
