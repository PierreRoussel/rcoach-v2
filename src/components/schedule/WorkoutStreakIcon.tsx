import { Dumbbell } from 'lucide-react'

import {
  WORKOUT_STREAK_ACCENT_CLASS,
  WORKOUT_STREAK_ON_ACCENT_CLASS,
} from '@/lib/schedule/workout-streak-visuals'
import { cn } from '@/lib/utils'

type WorkoutStreakIconProps = {
  className?: string
  /** `accent` = violet sur fond clair ; `on-accent` = blanc sur badge violet */
  variant?: 'accent' | 'on-accent'
}

export function WorkoutStreakIcon({
  className,
  variant = 'accent',
}: WorkoutStreakIconProps) {
  return (
    <Dumbbell
      className={cn(
        'shrink-0',
        variant === 'on-accent'
          ? WORKOUT_STREAK_ON_ACCENT_CLASS
          : WORKOUT_STREAK_ACCENT_CLASS,
        className,
      )}
      aria-hidden
    />
  )
}
