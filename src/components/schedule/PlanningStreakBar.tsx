import { Dumbbell, Flame, ListChecks } from 'lucide-react'

import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { Pill, StatCard } from '@/design-system'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { useWorkoutWeeklyStreak } from '@/hooks/useWorkouts'
import { cn } from '@/lib/utils'

type PlanningStreakBarProps = {
  className?: string
  activePlanningCount?: number
  onPlanningClick?: () => void
}

export function PlanningStreakBar({
  className,
  activePlanningCount,
  onPlanningClick,
}: PlanningStreakBarProps) {
  const { streak: weeklyStreak } = useWorkoutWeeklyStreak()
  const { data: settings } = useNutritionSettings()
  const dailyTarget = settings?.daily_calorie_target ?? 0
  const {
    streak: nutritionStreak,
    isFrozen,
    isLoading: nutritionStreakLoading,
  } = useNutritionStreak(dailyTarget)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<WorkoutStreakIcon className="size-4" />}
          value={String(weeklyStreak)}
          label="Sport"
          sub="Semaines avec séance"
          tone="purple"
        />

        {nutritionStreakLoading ? (
          <div className="h-[8.5rem] animate-pulse rounded-2xl bg-muted" />
        ) : (
          <StatCard
            icon={
              <Flame
                className={cn(
                  'size-4 fill-current',
                  isFrozen ? 'text-sky-500' : 'text-nutrition-streak-foreground',
                )}
              />
            }
            value={String(nutritionStreak)}
            label="Diète"
            sub={
              isFrozen
                ? 'Série gelée — jours objectif validés'
                : 'Jours objectif validés'
            }
            className="border border-[color-mix(in_srgb,var(--nutrition-streak-foreground)_22%,var(--border))] bg-nutrition-streak"
          />
        )}
      </div>

      {activePlanningCount != null && onPlanningClick ? (
        <button
          type="button"
          onClick={onPlanningClick}
          className="flex w-full items-center justify-between rounded-2xl border border-secondary/20 bg-soft-secondary px-4 py-3 text-left transition-colors hover:bg-soft-secondary/80 active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/60">
              <ListChecks className="size-4 text-secondary-foreground" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-black text-foreground">
                Planifications actives
              </p>
              <p className="text-xs text-muted-foreground">
                Voir les règles et séances programmées
              </p>
            </div>
          </div>
          <Pill tone="secondary" className="shrink-0 tabular-nums">
            {activePlanningCount}
          </Pill>
        </button>
      ) : null}
    </div>
  )
}
