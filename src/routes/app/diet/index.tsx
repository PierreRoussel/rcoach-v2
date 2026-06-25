import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { z } from 'zod'

import { CalorieRingGauge } from '@/components/nutrition/CalorieRingGauge'
import { DietDayCarousel } from '@/components/nutrition/DietDayCarousel'
import { MacroProgressBars } from '@/components/nutrition/MacroProgressBars'
import { MealSummaryCard } from '@/components/nutrition/MealSummaryCard'
import { NutritionOnboardingWizard } from '@/components/nutrition/NutritionOnboardingWizard'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/design-system'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { usePendingNutritionSyncCount } from '@/hooks/usePendingNutritionSync'
import { toDateKey } from '@/lib/nutrition/dates'
import type { MealLogEntry } from '@/lib/nutrition/types'

const dietSearchSchema = z.object({
  date: z.string().optional(),
})

export const Route = createFileRoute('/app/diet/')({
  validateSearch: dietSearchSchema,
  component: DietPage,
})

const NUTRITION_ONBOARDING_DISMISSED_KEY = 'nutrition-onboarding-dismissed'

function DietPage() {
  const navigate = useNavigate({ from: '/app/diet/' })
  const search = Route.useSearch()
  const date = search.date ?? toDateKey(new Date())
  const { data: settings, isLoading: settingsLoading } = useNutritionSettings()
  const { data: pendingSyncCount = 0 } = usePendingNutritionSyncCount()
  const { data: daySummary, isLoading: dayLoading } = useNutritionDay(date, settings)
  const { deleteEntry, updateEntry } = useMealLogMutations()
  const [editingEntry, setEditingEntry] = useState<MealLogEntry | null>(null)
  const [wizardDismissed, setWizardDismissed] = useState(
    () => sessionStorage.getItem(NUTRITION_ONBOARDING_DISMISSED_KEY) === '1',
  )

  const needsOnboarding = !settingsLoading && !settings?.onboarded_at
  const showWizard = needsOnboarding && !wizardDismissed

  const previewByMeal = useMemo(() => {
    if (!daySummary) {
      return new Map<string, string | null>()
    }

    return new Map(
      daySummary.meals.map((meal) => [
        meal.mealType,
        meal.entries[0]?.food.name ?? null,
      ]),
    )
  }, [daySummary])

  function handleDateChange(nextDate: string) {
    void navigate({
      search: { date: nextDate },
      replace: true,
    })
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Diete"
          description="Suivez vos repas et vos macros au quotidien."
        />
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link to="/app/diet/settings">
            <Settings2 className="size-4" />
          </Link>
        </Button>
      </div>

      {pendingSyncCount > 0 ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          {pendingSyncCount} modification{pendingSyncCount > 1 ? 's' : ''} en attente de synchronisation.
        </p>
      ) : null}

      {settingsLoading || dayLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chargement du journal nutrition...
          </CardContent>
        </Card>
      ) : settings && daySummary ? (
        <DietDayCarousel
          date={date}
          onDateChange={handleDateChange}
          renderDay={() => (
            <div className="space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-5 p-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="text-center">
                      <div className="font-display text-2xl font-black">
                        {Math.round(daySummary.totals.calories)}
                      </div>
                      <div className="text-xs text-muted-foreground">Consommees</div>
                    </div>
                    <CalorieRingGauge
                      consumed={daySummary.totals.calories}
                      target={daySummary.targets.calories}
                    />
                    <div className="text-center">
                      <div className="font-display text-2xl font-black">0</div>
                      <div className="text-xs text-muted-foreground">Brulees</div>
                    </div>
                  </div>

                  <MacroProgressBars
                    carbs={{
                      current: daySummary.totals.carbsG,
                      target: daySummary.targets.carbsG,
                    }}
                    protein={{
                      current: daySummary.totals.proteinG,
                      target: daySummary.targets.proteinG,
                    }}
                    fat={{
                      current: daySummary.totals.fatG,
                      target: daySummary.targets.fatG,
                    }}
                  />
                </CardContent>
              </Card>

              <div className="space-y-3">
                {daySummary.meals.map((meal) => (
                  <MealSummaryCard
                    key={meal.mealType}
                    date={date}
                    mealType={meal.mealType}
                    consumedCalories={meal.totals.calories}
                    targetCalories={meal.targetCalories}
                    previewLabel={previewByMeal.get(meal.mealType) ?? null}
                    entries={meal.entries}
                    expandable
                    onEditEntry={(entryId) => {
                      const entry = meal.entries.find((item) => item.id === entryId)
                      if (entry) {
                        setEditingEntry(entry)
                      }
                    }}
                    onDeleteEntry={(entryId) => {
                      void deleteEntry.mutateAsync({ id: entryId, loggedDate: date })
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        />
      ) : null}

      {needsOnboarding && wizardDismissed ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Configurez vos objectifs nutritionnels pour suivre vos macros au quotidien.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => setWizardDismissed(false)}>
                Configurer maintenant
              </Button>
              <Button variant="outline" asChild>
                <Link to="/app/diet/settings">Ouvrir les reglages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <NutritionOnboardingWizard
        open={showWizard}
        onOpenChange={(open) => {
          if (!open) {
            sessionStorage.setItem(NUTRITION_ONBOARDING_DISMISSED_KEY, '1')
            setWizardDismissed(true)
          }
        }}
        onCompleted={() => {
          sessionStorage.removeItem(NUTRITION_ONBOARDING_DISMISSED_KEY)
          setWizardDismissed(false)
        }}
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
