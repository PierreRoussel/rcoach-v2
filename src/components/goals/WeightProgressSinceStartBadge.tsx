import { Flame } from 'lucide-react'

import {
  formatProgressSinceStart,
  isProgressOnTrack,
  type WeightGoal,
} from '@/lib/goals/weight-goal'
import { cn } from '@/lib/utils'

type WeightProgressSinceStartBadgeProps = {
  goal: Pick<WeightGoal, 'goal_type' | 'start_weight_kg' | 'current_weight_kg'>
  className?: string
}

export function WeightProgressSinceStartBadge({
  goal,
  className,
}: WeightProgressSinceStartBadgeProps) {
  const label = formatProgressSinceStart(goal)
  const onTrack = isProgressOnTrack(goal)

  if (onTrack) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300',
          className,
        )}
      >
        <Flame className="size-3.5 shrink-0" aria-hidden />
        {label}
      </span>
    )
  }

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>{label}</p>
  )
}
