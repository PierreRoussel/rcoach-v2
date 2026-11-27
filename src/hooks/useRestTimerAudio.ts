import { useEffect, useRef } from 'react'

import { playRestCountdownBeep } from '@/lib/workout/rest-timer-audio'
import { notifyRestCountdownTick } from '@/lib/workout/timer-haptics'

export function useRestTimerAudio(isResting: boolean, restSecondsLeft: number) {
  const lastBeepSecondRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isResting) {
      lastBeepSecondRef.current = null
      return
    }

    if (restSecondsLeft > 3) {
      lastBeepSecondRef.current = null
      return
    }

    if (restSecondsLeft !== 3 && restSecondsLeft !== 2 && restSecondsLeft !== 1) {
      return
    }

    if (lastBeepSecondRef.current === restSecondsLeft) {
      return
    }

    lastBeepSecondRef.current = restSecondsLeft
    void playRestCountdownBeep(restSecondsLeft)
    notifyRestCountdownTick(restSecondsLeft)
  }, [isResting, restSecondsLeft])
}
