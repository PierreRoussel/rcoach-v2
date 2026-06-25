import { Link } from '@tanstack/react-router'
import { ChevronRight, Coffee, Moon, Soup, UtensilsCrossed } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MEAL_LABELS, type MealType } from '@/lib/nutrition/types'

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Soup,
  snack: UtensilsCrossed,
  dinner: Moon,
}

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
  const Icon = MEAL_ICONS[mealType]

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft-primary">
            <Icon className="size-5 text-primary" />
          </div>

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
      </CardContent>
    </Card>
  )
}
