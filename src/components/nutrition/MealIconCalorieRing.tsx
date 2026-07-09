import {
  MEAL_COLOR,
  MEAL_ICONS,
  MEAL_ICON_TINT,
  MEAL_RING_TRACK_COLOR,
} from '@/lib/nutrition/meal-visuals'
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
const OVER_TARGET_COLOR = '#c97a10'

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
  const progressColor = isOverTarget ? OVER_TARGET_COLOR : MEAL_COLOR[mealType]

  return (
    <div
      className={cn(
        'meal-calorie-ring relative grid size-14 shrink-0 place-items-center',
        className,
      )}
      data-meal-ring={mealType}
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
          className="meal-calorie-ring__track"
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={MEAL_RING_TRACK_COLOR[mealType]}
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          className="meal-calorie-ring__progress"
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={progressColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>

      <div
        className={cn(
          'col-start-1 row-start-1 flex size-11 items-center justify-center rounded-full',
          MEAL_ICON_TINT[mealType],
        )}
      >
        <Icon className="size-5" style={{ color: MEAL_COLOR[mealType] }} aria-hidden />
      </div>
    </div>
  )
}
