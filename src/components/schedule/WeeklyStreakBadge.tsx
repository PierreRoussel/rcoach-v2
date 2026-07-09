import { WorkoutStreakPill } from '@/components/schedule/WorkoutStreakPill'

type WeeklyStreakIndicatorProps = {
  streak: number
  className?: string
}

/** Compact sport streak for calendar headers (profile, stats). */
export function WeeklyStreakIndicator({
  streak,
  className,
}: WeeklyStreakIndicatorProps) {
  return <WorkoutStreakPill streak={streak} format="count" className={className} />
}
