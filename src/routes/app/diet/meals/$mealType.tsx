import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { MacroProgressBars } from '@/components/nutrition/MacroProgressBars'
import { MealEntryRow } from '@/components/nutrition/MealEntryRow'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { formatFrenchDateLabel, toDateKey } from '@/lib/nutrition/dates'
import {
  MEAL_CARD_TINT,
  MEAL_ICON_TINT,
  MEAL_ICONS,
} from '@/lib/nutrition/meal-visuals'
import { MEAL_LABELS, type MealLogEntry, type MealType } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

const mealSearchSchema = z.object({
  date: z.string().optional(),
})

const mealParamsSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
})

export const Route = createFileRoute('/app/diet/meals/$mealType')({
  validateSearch: mealSearchSchema,
  params: {
    parse: (params) => mealParamsSchema.parse(params),
  },
  component: MealDetailPage,
})

function MealDetailPage() {
  const { mealType } = Route.useParams()
  const search = Route.useSearch()
  const date = search.date ?? toDateKey(new Date())
  const dateLabel = formatFrenchDateLabel(date)
  const { data: settings } = useNutritionSettings()
  const { data: daySummary } = useNutritionDay(date, settings)
  const { updateEntry, deleteEntry } = useMealLogMutations()
  const [editingEntry, setEditingEntry] = useState<MealLogEntry | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const meal = daySummary?.meals.find((item) => item.mealType === mealType)
  const entries = meal?.entries ?? []
  const Icon = MEAL_ICONS[mealType as MealType]
  const consumedCalories = meal?.totals.calories ?? 0
  const targetCalories = meal?.targetCalories ?? 0
  const calorieProgress =
    targetCalories > 0 ? Math.min((consumedCalories / targetCalories) * 100, 100) : 0
  const dailyCalorieTarget = daySummary?.targets.calories ?? 0
  const mealCalorieShare =
    dailyCalorieTarget > 0 && targetCalories > 0 ? targetCalories / dailyCalorieTarget : 0
  const mealMacroTargets = {
    carbs: (daySummary?.targets.carbsG ?? 0) * mealCalorieShare,
    protein: (daySummary?.targets.proteinG ?? 0) * mealCalorieShare,
    fat: (daySummary?.targets.fatG ?? 0) * mealCalorieShare,
  }

  async function handleDeleteEntry(entryId: string) {
    setDeleteError(null)

    try {
      await deleteEntry.mutateAsync({ id: entryId, loggedDate: date })
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Impossible de supprimer cet aliment.',
      )
    }
  }

  return (
    <div
      className="meal-detail-page space-y-5 pb-28"
      data-meal-type={mealType}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-full border-border/70 bg-card shadow-sm"
          asChild
        >
          <Link to="/app/diet" search={{ date }} aria-label="Retour au journal">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>

        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            MEAL_ICON_TINT[mealType as MealType],
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-black leading-tight text-foreground">
            {MEAL_LABELS[mealType as MealType]}
          </h1>
          <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>
        </div>
      </div>

      <Card
        className={cn(
          'overflow-hidden border-border/70 shadow-sm',
          MEAL_CARD_TINT[mealType as MealType],
        )}
      >
        <CardContent className="space-y-3 p-3">
          <div className="space-y-2">
            <div>
              <div className="font-display text-2xl font-black leading-none tabular-nums text-foreground">
                {Math.round(consumedCalories)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                sur <span className="font-semibold text-foreground">{targetCalories}</span> Cal
              </div>
            </div>
            <Progress value={calorieProgress} className="h-2 bg-muted" />
          </div>
          <MacroProgressBars
            carbs={{
              current: meal?.totals.carbsG ?? 0,
              target: mealMacroTargets.carbs,
            }}
            protein={{
              current: meal?.totals.proteinG ?? 0,
              target: mealMacroTargets.protein,
            }}
            fat={{
              current: meal?.totals.fatG ?? 0,
              target: mealMacroTargets.fat,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-3">
            {deleteError ? (
              <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {deleteError}
              </p>
            ) : null}

            {entries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <div className="flex size-14 items-center justify-center rounded-full border border-border/70 bg-muted">
                  <UtensilsCrossed className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-base font-bold text-foreground">
                    Aucun aliment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez votre premier aliment a ce repas.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link to="/app/diet/add" search={{ date, mealType }}>
                    <Plus className="size-4" />
                    Ajouter un aliment
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <MealEntryRow
                    key={entry.id}
                    name={entry.food.name}
                    brand={entry.food.brand}
                    calories={Number(entry.calories)}
                    quantityG={entry.quantity_g}
                    servings={entry.servings}
                    onEdit={() => setEditingEntry(entry)}
                    onDelete={() => void handleDeleteEntry(entry.id)}
                  />
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-lg border-t border-border/70 bg-background px-4 py-3">
        <Button className="w-full rounded-full shadow-sm" size="lg" asChild>
          <Link to="/app/diet/add" search={{ date, mealType }}>
            <Plus className="size-5" />
            Ajouter plus
          </Link>
        </Button>
      </div>

      <PortionPickerSheet
        open={Boolean(editingEntry)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEntry(null)
          }
        }}
        food={editingEntry?.food ?? null}
        isSubmitting={updateEntry.isPending}
        onConfirm={(portion) => {
          if (!editingEntry) {
            return
          }

          void updateEntry
            .mutateAsync({
              id: editingEntry.id,
              loggedDate: date,
              mealType,
              food: editingEntry.food,
              portion,
            })
            .then(() => setEditingEntry(null))
        }}
      />
    </div>
  )
}
