import { MacroSplitRing } from '@/components/nutrition/MacroSplitRing'
import { DIET_ACCENT_RING } from '@/lib/nutrition/diet-theme'
import { cn } from '@/lib/utils'

type CalorieRingGaugeProps = {
  consumed: number
  target: number
  className?: string
}

export function CalorieRingGauge({
  consumed,
  target,
  className,
}: CalorieRingGaugeProps) {
  const isOverTarget = target > 0 && consumed > target
  const remaining = Math.max(0, target - consumed)
  const overBy = Math.max(0, consumed - target)
  const centerValue = Math.round(isOverTarget ? overBy : remaining)
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0
  const radius = 76
  const size = 224

  return (
    <div
      className={cn('relative mx-auto flex size-56 items-center justify-center', className)}
      aria-label={
        isOverTarget
          ? `${centerValue} calories en trop`
          : `${centerValue} calories restantes`
      }
    >
      <MacroSplitRing
        progress={progress}
        radius={radius}
        strokeWidth={12}
        size={size}
        isOverTarget={isOverTarget}
        accentClassName={DIET_ACCENT_RING}
        className="size-full"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-4xl font-black text-foreground">{centerValue}</div>
        <div
          className={cn(
            'text-base font-semibold',
            isOverTarget
              ? 'text-[var(--nutrient-warning-fg)]'
              : 'text-muted-foreground',
          )}
        >
          {isOverTarget ? 'En trop' : 'Restantes'}
        </div>
      </div>
    </div>
  )
}
