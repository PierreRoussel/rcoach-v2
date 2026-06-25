import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { MealEntryRow } from '@/components/nutrition/MealEntryRow'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/design-system'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { MEAL_LABELS, type MealType } from '@/lib/nutrition/types'
import { toDateKey } from '@/lib/nutrition/dates'
import { useState } from 'react'
import type { MealLogEntry } from '@/lib/nutrition/types'

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
  const { data: settings } = useNutritionSettings()
  const { data: daySummary } = useNutritionDay(date, settings)
  const { updateEntry, deleteEntry } = useMealLogMutations()
  const [editingEntry, setEditingEntry] = useState<MealLogEntry | null>(null)

  const meal = daySummary?.meals.find((item) => item.mealType === mealType)

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={MEAL_LABELS[mealType as MealType]}
        description={`${Math.round(meal?.totals.calories ?? 0)} / ${meal?.targetCalories ?? 0} Cal`}
      />

      <Card>
        <CardContent className="grid grid-cols-4 gap-2 p-4 text-center text-sm">
          <div>
            <div className="font-bold">{Math.round(meal?.totals.calories ?? 0)}</div>
            <div className="text-muted-foreground">Cal</div>
          </div>
          <div>
            <div className="font-bold">{meal?.totals.carbsG ?? 0}</div>
            <div className="text-muted-foreground">Gluc.</div>
          </div>
          <div>
            <div className="font-bold">{meal?.totals.proteinG ?? 0}</div>
            <div className="text-muted-foreground">Prot.</div>
          </div>
          <div>
            <div className="font-bold">{meal?.totals.fatG ?? 0}</div>
            <div className="text-muted-foreground">Lip.</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-2">
          {(meal?.entries ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun aliment pour ce repas.
            </p>
          ) : (
            meal?.entries.map((entry) => (
              <MealEntryRow
                key={entry.id}
                name={entry.food.name}
                brand={entry.food.brand}
                calories={Number(entry.calories)}
                quantityG={entry.quantity_g}
                servings={entry.servings}
                onEdit={() => setEditingEntry(entry)}
                onDelete={() => void deleteEntry.mutateAsync({ id: entry.id, loggedDate: date })}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-lg px-4">
        <Button className="w-full rounded-full" size="lg" asChild>
          <Link to="/app/diet/add" search={{ date, mealType }}>
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
              food: editingEntry.food,
              portion,
            })
            .then(() => setEditingEntry(null))
        }}
      />
    </div>
  )
}
