import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Coffee, Moon, Soup, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MEAL_LABELS, type MealType } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

import { MealEntryRow } from '@/components/nutrition/MealEntryRow'

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
  entries: Array<{
    id: string
    food: { name: string; brand: string | null }
    calories: number
    quantity_g: number | null
    servings: number | null
  }>
  expandable?: boolean
  onEditEntry?: (entryId: string) => void
  onDeleteEntry?: (entryId: string) => void
}

export function MealSummaryCard({
  date,
  mealType,
  consumedCalories,
  targetCalories,
  previewLabel,
  entries,
  expandable = false,
  onEditEntry,
  onDeleteEntry,
}: MealSummaryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = MEAL_ICONS[mealType]

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-soft-primary">
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

          <div className="flex items-center gap-1">
            {expandable && entries.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
              >
                <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
              </Button>
            ) : null}
            <Button variant="default" size="icon" className="size-9 rounded-full" asChild>
              <Link
                to="/app/diet/add"
                search={{ date, mealType }}
                aria-label={`Ajouter un aliment au ${MEAL_LABELS[mealType].toLowerCase()}`}
              >
                +
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link to="/app/diet/meals/$mealType" params={{ mealType }} search={{ date }}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {expandable && expanded ? (
          <div className="border-t border-border/70 px-4 py-2">
            {entries.map((entry) => (
              <MealEntryRow
                key={entry.id}
                name={entry.food.name}
                brand={entry.food.brand}
                calories={Number(entry.calories)}
                quantityG={entry.quantity_g}
                servings={entry.servings}
                onEdit={onEditEntry ? () => onEditEntry(entry.id) : undefined}
                onDelete={onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
