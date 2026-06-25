import { Button } from '@/components/ui/button'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
import { cn } from '@/lib/utils'

const PERIOD_OPTIONS: Array<{ value: StatsPeriod; label: string }> = [
  { value: '3m', label: '3 mois' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Toujours' },
]

type ExercisePeriodSelectorProps = {
  value: StatsPeriod
  onChange: (period: StatsPeriod) => void
  className?: string
}

export function ExercisePeriodSelector({
  value,
  onChange,
  className,
}: ExercisePeriodSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PERIOD_OPTIONS.map((option) => (
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

export { PERIOD_OPTIONS }
