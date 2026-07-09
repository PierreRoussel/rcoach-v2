import { Pill } from '@/design-system'
import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { formatWeeklyStreakLabel } from '@/lib/schedule/weekly-streak'
import { cn } from '@/lib/utils'

type WorkoutStreakPillProps = {
  streak: number
  className?: string
  format?: 'full' | 'compact' | 'count'
  title?: string
}

function formatWorkoutStreakLabel(
  streak: number,
  format: WorkoutStreakPillProps['format'],
) {
  if (format === 'count') {
    return String(streak)
  }

  if (format === 'compact') {
    return `${streak} sem.`
  }

  if (streak === 1) {
    return '1 semaine'
  }

  return `${streak} semaines`
}

export function WorkoutStreakPill({
  streak,
  className,
  format = 'full',
  title,
}: WorkoutStreakPillProps) {
  const pill = (
    <Pill tone="solid-purple" className={cn('gap-1.5', className)}>
      <WorkoutStreakIcon variant="on-accent" className="size-3.5" />
      {formatWorkoutStreakLabel(streak, format)}
    </Pill>
  )

  const resolvedTitle = title ?? formatWeeklyStreakLabel(streak)

  return <span title={resolvedTitle}>{pill}</span>
}
