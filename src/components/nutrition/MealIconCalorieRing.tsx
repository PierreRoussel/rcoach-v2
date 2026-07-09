import { MEAL_ICONS, MEAL_ICON_TINT } from '@/lib/nutrition/meal-visuals'
import type { MacroGrams } from '@/lib/nutrition/macro-visuals'
import type { MealType } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

import { MacroSplitRing } from '@/components/nutrition/MacroSplitRing'

type MealIconCalorieRingProps = {
  mealType: MealType
  consumedCalories: number
  targetCalories: number
  macros?: MacroGrams
  className?: string
}

const RING_SIZE = 56
const STROKE_WIDTH = 3
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2

export function MealIconCalorieRing({
  mealType,
  consumedCalories,
  targetCalories,
  macros,
  className,
}: MealIconCalorieRingProps) {
  const Icon = MEAL_ICONS[mealType]
  const remaining = Math.max(0, targetCalories - consumedCalories)
  const isOverTarget = targetCalories > 0 && consumedCalories > targetCalories
  const progress = targetCalories > 0 ? Math.min(consumedCalories / targetCalories, 1) : 0

  return (
    <div
      className={cn('relative grid size-14 shrink-0 place-items-center', className)}
      role="img"
      aria-label={`${Math.round(remaining)} calories restantes pour ce repas`}
    >
      <MacroSplitRing
        progress={progress}
        macros={macros}
        radius={RING_RADIUS}
        strokeWidth={STROKE_WIDTH}
        size={RING_SIZE}
        isOverTarget={isOverTarget}
        className="col-start-1 row-start-1"
      />

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
