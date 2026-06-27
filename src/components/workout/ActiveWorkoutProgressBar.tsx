import { useRouterState } from '@tanstack/react-router'

import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import {
  computeWorkoutProgressPercent,
  countCompletedSets,
  countPlannedSets,
} from '@/lib/workout/workout-circuit'
import { cn } from '@/lib/utils'

export function ActiveWorkoutProgressBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)
  const exercises = useActiveWorkoutStore((state) => state.exercises)

  const isOnActiveWorkoutPage = pathname.startsWith('/app/workout/active')

  if (!startedAt || !isOnActiveWorkoutPage) {
    return null
  }

  const completedSets = countCompletedSets(exercises)
  const totalSets = countPlannedSets(exercises)
  const progressPercent = computeWorkoutProgressPercent(exercises)

  return (
    <div
      role="progressbar"
      aria-label="Avancement de la séance"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progressPercent)}
      aria-valuetext={
        totalSets > 0
          ? `${completedSets} séries validées sur ${totalSets}`
          : 'Aucune série planifiée'
      }
      className="h-1 w-full overflow-hidden bg-soft-secondary/60"
    >
      <div
        className={cn(
          'h-full bg-gradient-to-r from-soft-secondary via-secondary to-secondary',
          'transition-[width] duration-500 ease-out',
        )}
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  )
}
