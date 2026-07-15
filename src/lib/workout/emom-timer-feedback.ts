import type { EmomTickEvent } from '@/lib/workout/emom-store'
import {
  playRestCompleteBeep,
  playRestCountdownBeep,
} from '@/lib/workout/rest-timer-audio'

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

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
        vibrate(35)
        break
      case 'countdown_complete':
        void playRestCompleteBeep()
        vibrate([50, 40, 50])
        break
      case 'minute_start':
        void playRestCompleteBeep()
        vibrate(70)
        break
      case 'workout_complete':
        void playRestCompleteBeep()
        vibrate([90, 45, 90])
        break
      default:
        break
    }
  }
}
