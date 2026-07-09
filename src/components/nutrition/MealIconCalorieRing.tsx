import { MEAL_ICONS, MEAL_ICON_TINT, MEAL_RING_COLOR } from '@/lib/nutrition/meal-visuals'
import type { MealType } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

type MealIconCalorieRingProps = {
  mealType: MealType
  consumedCalories: number
  targetCalories: number
  className?: string
}

const RING_SIZE = 56
const STROKE_WIDTH = 3
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2

export function MealIconCalorieRing({
  mealType,
  consumedCalories,
  targetCalories,
  className,
}: MealIconCalorieRingProps) {
  const Icon = MEAL_ICONS[mealType]
  const remaining = Math.max(0, targetCalories - consumedCalories)
  const isOverTarget = targetCalories > 0 && consumedCalories > targetCalories
  const progress = targetCalories > 0 ? Math.min(consumedCalories / targetCalories, 1) : 0
  const circumference = 2 * Math.PI * RING_RADIUS
  const dashOffset = circumference * (1 - progress)
  const center = RING_SIZE / 2

  return (
    <div
      className={cn('relative grid size-14 shrink-0 place-items-center', className)}
      role="img"
      aria-label={`${Math.round(remaining)} calories restantes pour ce repas`}
    >
      <svg
        className="pointer-events-none col-start-1 row-start-1 -rotate-90"
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-muted/35"
        />
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={isOverTarget ? 'var(--nutrient-warning-fg)' : MEAL_RING_COLOR[mealType]}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>

      <div
        className={cn(
          'col-start-1 row-start-1 flex size-11 items-center justify-center rounded-full',
          MEAL_ICON_TINT[mealType],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
    </div>
  )
}
