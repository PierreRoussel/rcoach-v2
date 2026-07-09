import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { WorkoutStreakPill } from '@/components/schedule/WorkoutStreakPill'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { useWorkoutWeeklyStreak } from '@/hooks/useWorkouts'
import { cn } from '@/lib/utils'

type PlanningStreakBarProps = {
  className?: string
}

export function PlanningStreakBar({ className }: PlanningStreakBarProps) {
  const { streak: weeklyStreak } = useWorkoutWeeklyStreak()
  const { data: settings } = useNutritionSettings()
  const dailyTarget = settings?.daily_calorie_target ?? 0
  const {
    streak: nutritionStreak,
    isFrozen,
    isLoading: nutritionStreakLoading,
  } = useNutritionStreak(dailyTarget)

  const nutritionTitle = isFrozen
    ? `Série gelée : ${nutritionStreak} jour${nutritionStreak > 1 ? 's' : ''}`
    : `Série nutrition : ${nutritionStreak} jour${nutritionStreak > 1 ? 's' : ''}`

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--chart-4)_28%,var(--border))] bg-gradient-to-br from-soft-purple/55 via-card to-card px-3 py-3 shadow-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-soft-purple-fg">
          Sport
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Semaines avec séance</p>
        <div className="mt-2">
          <WorkoutStreakPill streak={weeklyStreak} format="full" />
        </div>
      </div>

      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--nutrition-streak-foreground)_22%,var(--border))] bg-gradient-to-br from-nutrition-streak/80 via-card to-card px-3 py-3 shadow-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-nutrition-streak-foreground">
          Diète
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Jours objectif validés</p>
        <div className="mt-2">
          {nutritionStreakLoading ? (
            <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
          ) : (
            <NutritionStreakPill
              streak={nutritionStreak}
              isFrozen={isFrozen}
              title={nutritionTitle}
            />
          )}
        </div>
      </div>
    </div>
  )
}
