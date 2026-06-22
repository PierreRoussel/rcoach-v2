import { Flame } from 'lucide-react'

import { Pill } from '@/design-system'
import { formatWeeklyStreakLabel } from '@/lib/schedule/weekly-streak'
import { cn } from '@/lib/utils'

type WeeklyStreakIndicatorProps = {
  streak: number
  className?: string
}

export function WeeklyStreakIndicator({
  streak,
  className,
}: WeeklyStreakIndicatorProps) {
  return (
    <span title={formatWeeklyStreakLabel(streak)}>
      <Pill tone="accent" className={cn('shrink-0', className)}>
        <Flame className="size-3" />
        {streak}
      </Pill>
    </span>
  )
}
