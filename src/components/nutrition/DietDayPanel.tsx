import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Target, UtensilsCrossed, type LucideIcon } from 'lucide-react'

import { CalorieRingGauge } from '@/components/nutrition/CalorieRingGauge'
import { MacroProgressBars } from '@/components/nutrition/MacroProgressBars'
import { MealSummaryCard } from '@/components/nutrition/MealSummaryCard'
import { NutritionCalendarDrawer } from '@/components/nutrition/NutritionCalendarDrawer'
import { NutritionStreakBadge } from '@/components/nutrition/NutritionStreakBadge'
import { useNutritionStreakGamificationActions } from '@/components/nutrition/NutritionStreakGamificationProvider'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateIn, Pill, StaggerGroup } from '@/design-system'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { getMealEntryName } from '@/lib/nutrition/meal-entry-display'
import { toDateKey } from '@/lib/nutrition/dates'
import type { NutritionSettings } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

type CalorieSideStatProps = {
  icon: LucideIcon
  iconClassName: string
  value: number
  label: string
  className?: string
  iconFilled?: boolean
  to?: string
  linkAriaLabel?: string
}

function CalorieSideStat({
  icon: Icon,
  iconClassName,
  value,
  label,
  className,
  iconFilled = false,
  to,
  linkAriaLabel,
}: CalorieSideStatProps) {
  const content = (
    <>
      <div
        className={cn(
          'flex size-7 items-center justify-center rounded-full',
          iconClassName,
        )}
      >
        <Icon className={cn('size-3.5', iconFilled && 'fill-current')} aria-hidden />
      </div>
      <div className="font-display text-lg font-black leading-none tabular-nums">{value}</div>
      <div className="text-[10px] leading-tight text-muted-foreground">{label}</div>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'flex w-14 flex-col items-center gap-1 text-center transition-opacity hover:opacity-80 active:opacity-70',
          className,
        )}
        aria-label={linkAriaLabel ?? label}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={cn('flex w-14 flex-col items-center gap-1 text-center', className)}>
      {content}
    </div>
  )
}

type DietDayPanelProps = {
  date: string
  settings: NutritionSettings
  streak: number
  isFrozen?: boolean
  validatedToday?: boolean
  animateEntrance?: boolean
}

export function DietDayPanel({
  date,
  settings,
  streak,
  isFrozen = false,
  validatedToday = false,
  animateEntrance = false,
}: DietDayPanelProps) {
  const { data: daySummary, isLoading } = useNutritionDay(date, settings)
  const { showRecoveryChallenge } = useNutritionStreakGamificationActions()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const previewByMeal = useMemo(() => {
    if (!daySummary) {
      return new Map<string, string | null>()
    }

    return new Map(
      daySummary.meals.map((meal) => [
        meal.mealType,
        meal.entries[0] ? getMealEntryName(meal.entries[0]) : null,
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
          onStreakClick={() => {
            if (isFrozen) {
              showRecoveryChallenge()
              return
            }

            setCalendarOpen(true)
          }}
          onCalendarClick={() => setCalendarOpen(true)}
          className="absolute right-3 top-3 z-10"
          isFrozen={isFrozen}
          validatedToday={validatedToday}
        />

        <div className="relative flex min-h-44 items-center justify-center px-12">
          <CalorieRingGauge
            consumed={daySummary.totals.calories}
            target={daySummary.targets.calories}
          />
          <CalorieSideStat
            className="absolute bottom-0 left-0"
            icon={UtensilsCrossed}
            iconClassName="bg-soft-primary text-primary"
            value={Math.round(daySummary.totals.calories)}
            label="Cons."
          />
          <CalorieSideStat
            className="absolute bottom-0 right-0"
            icon={Target}
            iconClassName="bg-soft-secondary text-secondary-foreground"
            value={Math.round(daySummary.targets.calories)}
            label="Objectif"
            to="/app/goals"
            linkAriaLabel="Voir mon objectif"
          />
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
        dailyTarget={daySummary.targets.calories}
        streak={streak}
        isFrozen={isFrozen}
        activeDate={date}
      />
    </>
  )
}
