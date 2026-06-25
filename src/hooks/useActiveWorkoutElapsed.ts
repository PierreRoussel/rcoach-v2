import { useEffect, useState } from 'react'

import { formatActiveWorkoutElapsed } from '@/lib/workout/workout-encouragement'

export function useActiveWorkoutElapsed(startedAt: string | null): string | null {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!startedAt) {
      return
    }

    const tick = () => setNow(new Date())
    tick()

    const timer = window.setInterval(tick, 1000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startedAt])

  if (!startedAt) {
    return null
  }

  return formatActiveWorkoutElapsed(startedAt, now)
}
