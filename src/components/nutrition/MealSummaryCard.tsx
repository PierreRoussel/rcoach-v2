import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { MealIconCalorieRing } from '@/components/nutrition/MealIconCalorieRing'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MEAL_LABELS, type MealType } from '@/lib/nutrition/types'

type MealSummaryCardProps = {
  date: string
  mealType: MealType
  consumedCalories: number
  targetCalories: number
  previewLabel?: string | null
}

export function MealSummaryCard({
  date,
  mealType,
  consumedCalories,
  targetCalories,
  previewLabel,
}: MealSummaryCardProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/70 shadow-sm">
      <div className="flex items-center gap-3 p-4">
          <MealIconCalorieRing
            mealType={mealType}
            consumedCalories={consumedCalories}
            targetCalories={targetCalories}
          />

          <Link
            to="/app/diet/meals/$mealType"
            params={{ mealType }}
            search={{ date }}
            className="min-w-0 flex-1"
          >
            <div className="font-display text-base font-bold text-foreground">
              {MEAL_LABELS[mealType]}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(consumedCalories)} / {targetCalories} Cal
            </div>
            {previewLabel ? (
              <div className="truncate text-xs text-muted-foreground">{previewLabel}</div>
            ) : null}
          </Link>

          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <Link to="/app/diet/meals/$mealType" params={{ mealType }} search={{ date }}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
      </div>
    </Card>
  )
}
