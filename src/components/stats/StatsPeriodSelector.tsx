import { Button } from '@/components/ui/button'
import {
  STATS_WORKOUT_PERIOD_OPTIONS,
  type StatsWorkoutPeriod,
} from '@/lib/stats/stats-workout-period'
import { cn } from '@/lib/utils'

type StatsPeriodSelectorProps = {
  value: StatsWorkoutPeriod
  onChange: (period: StatsWorkoutPeriod) => void
  className?: string
}

export function StatsPeriodSelector({
  value,
  onChange,
  className,
}: StatsPeriodSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {STATS_WORKOUT_PERIOD_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? 'pill' : 'outline'}
          className="rounded-full px-3"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export { STATS_WORKOUT_PERIOD_OPTIONS }
