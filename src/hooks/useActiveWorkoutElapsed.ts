import { useEffect, useState } from 'react'

import { formatActiveWorkoutElapsed } from '@/lib/workout/workout-encouragement'

export function useActiveWorkoutElapsed(startedAt: string | null): string | null {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!startedAt) {
      return
    }

    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  if (!startedAt) {
    return null
  }

  return formatActiveWorkoutElapsed(startedAt, now)
}
