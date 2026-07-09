import {
  formatWeightKg,
  resolveMaintainGoalDisplay,
  type WeightGoal,
} from '@/lib/goals/weight-goal'
import { cn } from '@/lib/utils'

type WeightMaintainDriftGaugeProps = {
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>
  className?: string
  compact?: boolean
}

export function WeightMaintainDriftGauge({
  goal,
  className,
  compact = false,
}: WeightMaintainDriftGaugeProps) {
  const display = resolveMaintainGoalDisplay(goal)
  const fillClass = display.inRange
    ? 'bg-secondary'
    : 'bg-primary'

  return (
    <div className={cn('space-y-2', className)}>
      {!compact ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span
            className={cn(
              'font-medium',
              display.inRange
                ? 'text-secondary-foreground'
                : 'text-muted-foreground',
            )}
          >
            {display.inRange ? 'En range' : 'Écart par rapport à la cible'}
          </span>
          {display.direction !== 'center' ? (
            <span
              className={cn(
                'tabular-nums',
                display.inRange
                  ? 'text-secondary-foreground'
                  : 'font-medium text-primary',
              )}
            >
              {formatWeightKg(Math.abs(display.driftKg))}
              {display.direction === 'low' ? ' en dessous' : ' au-dessus'}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'relative flex h-2.5 w-full overflow-hidden rounded-full',
          display.inRange ? 'bg-soft-secondary' : 'bg-muted',
        )}
        role="img"
        aria-label={`Objectif ${formatWeightKg(goal.target_weight_kg)}, écart ${formatWeightKg(Math.abs(display.driftKg))}`}
      >
        <div className="relative h-full w-1/2">
          {display.direction === 'low' ? (
            <div
              className={cn(
                'absolute right-0 top-0 h-full rounded-l-full transition-[width] duration-300',
                fillClass,
              )}
              style={{ width: `${display.gaugeFillPercent}%` }}
            />
          ) : null}
        </div>

        <div
          className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          aria-hidden
        >
          <div
            className={cn(
              'rounded-full border-2 bg-card shadow-sm',
              display.inRange
                ? 'size-3.5 border-secondary'
                : 'size-3 border-primary',
            )}
          />
        </div>

        <div className="absolute left-1/2 top-0 z-[1] h-full w-px -translate-x-1/2 bg-border/80" />

        <div className="relative h-full w-1/2">
          {display.direction === 'high' ? (
            <div
              className={cn(
                'absolute left-0 top-0 h-full rounded-r-full transition-[width] duration-300',
                fillClass,
              )}
              style={{ width: `${display.gaugeFillPercent}%` }}
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Perte</span>
        <span className="font-display text-sm font-bold tabular-nums text-foreground">
          {formatWeightKg(goal.target_weight_kg)}
        </span>
        <span>Prise</span>
      </div>
    </div>
  )
}
