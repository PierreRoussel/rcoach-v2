import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { MacroProgressBars } from '@/components/nutrition/MacroProgressBars'
import { MealEntryDetailDrawer } from '@/components/nutrition/MealEntryDetailDrawer'
import { MealEntryRow } from '@/components/nutrition/MealEntryRow'
import { MealIconCalorieRing } from '@/components/nutrition/MealIconCalorieRing'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { formatFrenchDateLabel, toDateKey } from '@/lib/nutrition/dates'
import { getMealEntryName, isQuickMealEntry } from '@/lib/nutrition/meal-entry-display'
import { MEAL_RING_STROKE } from '@/lib/nutrition/meal-visuals'
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
  const [detailEntry, setDetailEntry] = useState<MealLogEntry | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const meal = daySummary?.meals.find((item) => item.mealType === mealType)
  const entries = meal?.entries ?? []
  const consumedCalories = meal?.totals.calories ?? 0
  const targetCalories = meal?.targetCalories ?? 0
  const roundedConsumed = Math.round(consumedCalories)
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
      className="meal-detail-page space-y-3 pb-28"
      data-meal-type={mealType}
    >
      <Card className="meal-detail-summary-card overflow-hidden border-border/70 shadow-md">
        <CardContent className="relative space-y-4 p-4">
          <div
            className="meal-detail-summary-glow pointer-events-none absolute -right-10 -top-10 size-36 rounded-full blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="meal-detail-back size-9 shrink-0 rounded-full border-border/70 bg-card/80 shadow-sm backdrop-blur-sm"
              asChild
            >
              <Link to="/app/diet" search={{ date }} aria-label="Retour au journal">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>

            <MealIconCalorieRing
              mealType={mealType as MealType}
              consumedCalories={consumedCalories}
              targetCalories={targetCalories}
              className="shrink-0 drop-shadow-sm"
            />

            <div className="min-w-0 flex-1">
              <p className="meal-detail-eyebrow text-[11px] font-semibold uppercase tracking-wide">
                Repas du jour
              </p>
              <h1 className="font-display text-2xl font-black leading-tight text-foreground">
                {MEAL_LABELS[mealType as MealType]}
              </h1>
              <p className="mt-0.5 text-sm capitalize text-muted-foreground">{dateLabel}</p>
            </div>
          </div>

          <div className="meal-detail-divider" aria-hidden />

          <div className="relative space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{roundedConsumed}</span> sur{' '}
                <span className="font-semibold text-foreground">{targetCalories}</span> Cal
              </p>
              <span
                className={cn(
                  'text-xs font-bold tabular-nums',
                  MEAL_RING_STROKE[mealType as MealType],
                )}
              >
                {Math.round(calorieProgress)}%
              </span>
            </div>
            <Progress value={calorieProgress} className="meal-detail-calorie-progress h-2.5" />
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

      <Card className="meal-detail-entries overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-0">
          {deleteError ? (
            <p className="m-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
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
                  Ajoutez votre premier aliment à ce repas.
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
            <div className="divide-y divide-border/70">
              {entries.map((entry) => (
                <MealEntryRow
                  key={entry.id}
                  name={getMealEntryName(entry)}
                  brand={isQuickMealEntry(entry) ? 'Ajout rapide' : entry.food?.brand ?? null}
                  calories={Number(entry.calories)}
                  quantityG={entry.quantity_g}
                  servings={entry.servings}
                  servingSizeG={Number(entry.food.serving_size_g)}
                  onSelect={() => setDetailEntry(entry)}
                  onEdit={
                    isQuickMealEntry(entry) || !entry.food
                      ? undefined
                      : () => setEditingEntry(entry)
                  }
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

      <MealEntryDetailDrawer
        open={Boolean(detailEntry)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailEntry(null)
          }
        }}
        entry={detailEntry}
        onEdit={
          detailEntry && detailEntry.food && !isQuickMealEntry(detailEntry)
            ? () => {
                setEditingEntry(detailEntry)
                setDetailEntry(null)
              }
            : undefined
        }
      />

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
          if (!editingEntry?.food) {
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
