import { useMemo, useState } from 'react'

import { CalorieRingGauge } from '@/components/nutrition/CalorieRingGauge'
import { MacroProgressBars } from '@/components/nutrition/MacroProgressBars'
import { MealSummaryCard } from '@/components/nutrition/MealSummaryCard'
import { NutritionCalendarDrawer } from '@/components/nutrition/NutritionCalendarDrawer'
import { NutritionStreakBadge } from '@/components/nutrition/NutritionStreakBadge'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateIn, Pill, StaggerGroup } from '@/design-system'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { toDateKey } from '@/lib/nutrition/dates'
import type { NutritionSettings } from '@/lib/nutrition/types'

type DietDayPanelProps = {
  date: string
  settings: NutritionSettings
  animateEntrance?: boolean
}

export function DietDayPanel({ date, settings, animateEntrance = false }: DietDayPanelProps) {
  const { data: daySummary, isLoading } = useNutritionDay(date, settings)
  const { streak } = useNutritionStreak(settings.daily_calorie_target)
  const [calendarOpen, setCalendarOpen] = useState(false)

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

  if (isLoading || !daySummary) {
    const loadingCard = (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    )

    return animateEntrance ? <AnimateIn delay={200}>{loadingCard}</AnimateIn> : loadingCard
  }

  const futureDayPill =
    date > toDateKey(new Date()) ? (
      <Pill tone="default" className="w-full justify-center py-2">
        Jour planifié — vous pouvez préparer vos repas à l'avance
      </Pill>
    ) : null

  const summaryCard = (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="relative space-y-5 p-4">
        <NutritionStreakBadge
          streak={streak}
          onClick={() => setCalendarOpen(true)}
          className="absolute right-3 top-3 z-10"
        />

        <div className="relative flex min-h-40 items-center justify-center">
          <CalorieRingGauge
            consumed={daySummary.totals.calories}
            target={daySummary.targets.calories}
          />
          <div className="absolute left-0 top-1/2 w-12 -translate-y-1/2 text-center">
            <div className="font-display text-lg font-black leading-none">
              {Math.round(daySummary.totals.calories)}
            </div>
            <div className="mt-1 text-[10px] leading-tight text-muted-foreground">Cons.</div>
          </div>
          <div className="absolute right-0 top-1/2 w-12 -translate-y-1/2 text-center">
            <div className="font-display text-lg font-black leading-none">0</div>
            <div className="mt-1 text-[10px] leading-tight text-muted-foreground">Brûl.</div>
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
  )

  const mealCards = daySummary.meals.map((meal) => (
    <MealSummaryCard
      key={meal.mealType}
      date={date}
      mealType={meal.mealType}
      consumedCalories={meal.totals.calories}
      targetCalories={meal.targetCalories}
      previewLabel={previewByMeal.get(meal.mealType) ?? null}
    />
  ))

  const panelContent = animateEntrance ? (
    <StaggerGroup baseDelay={200} staggerMs={70} className="space-y-4">
      {futureDayPill}
      {summaryCard}
      {mealCards}
    </StaggerGroup>
  ) : (
    <div className="space-y-4">
      {futureDayPill}
      {summaryCard}
      <div className="space-y-3">{mealCards}</div>
    </div>
  )

  return (
    <>
      {panelContent}

      <NutritionCalendarDrawer
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        dailyTarget={settings.daily_calorie_target}
        streak={streak}
      />
    </>
  )
}
