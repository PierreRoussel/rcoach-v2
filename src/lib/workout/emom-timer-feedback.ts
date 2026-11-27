import type { EmomTickEvent } from '@/lib/workout/emom-store'
import {
  playRestCompleteBeep,
  playRestCountdownBeep,
} from '@/lib/workout/rest-timer-audio'
import {
  HAPTIC_COMPLETE_PATTERN,
  vibrate,
  vibrateSoftTick,
} from '@/lib/workout/timer-haptics'

function playCountdownSecond(secondsLeft: number) {
  if (secondsLeft === 3 || secondsLeft === 2 || secondsLeft === 1) {
    void playRestCountdownBeep(secondsLeft)
  }
}

export async function handleEmomTickEvents(events: EmomTickEvent[]) {
  for (const event of events) {
    switch (event.type) {
      case 'countdown_tick':
        playCountdownSecond(event.secondsLeft)
        vibrateSoftTick()
        break
      case 'countdown_complete':
        void playRestCompleteBeep()
        void vibrate(HAPTIC_COMPLETE_PATTERN)
        break
      case 'minute_start':
        void playRestCompleteBeep()
        void vibrate(70)
        break
      case 'workout_complete':
        void playRestCompleteBeep()
        void vibrate([90, 45, 90])
        break
      default:
        break
    }
  }
}
