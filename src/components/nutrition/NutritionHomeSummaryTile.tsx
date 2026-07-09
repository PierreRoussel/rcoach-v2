import { Flame, Snowflake, UtensilsCrossed } from 'lucide-react'

import {
  HomeSummaryMetric,
  HomeSummaryMetricsRow,
  HomeSummaryProgress,
  HomeSummaryTile,
  HomeSummaryTileFooter,
  HomeSummaryTileSkeleton,
  Pill,
} from '@/design-system'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { toDateKey } from '@/lib/nutrition/dates'

function formatCalories(value: number) {
  return Math.round(value).toLocaleString('fr-FR')
}

function DietStreakBadge({
  streak,
  isFrozen,
  recoveryProgress,
}: {
  streak: number
  isFrozen: boolean
  recoveryProgress: number | null
}) {
  if (streak <= 0 && !isFrozen) {
    return null
  }

  return (
    <Pill
      tone={isFrozen ? 'default' : 'secondary'}
      className="h-7 shrink-0 gap-1 px-2.5 py-0 text-xs font-bold"
      title={
        isFrozen
          ? `Série gelée : ${streak} jour${streak > 1 ? 's' : ''}${recoveryProgress != null ? ` — recovery ${recoveryProgress}/2` : ''}`
          : `Série : ${streak} jour${streak > 1 ? 's' : ''}`
      }
    >
      {isFrozen ? (
        <Snowflake className="size-3.5 text-sky-500" aria-hidden />
      ) : (
        <Flame className="size-3.5 fill-current" aria-hidden />
      )}
      {streak}
      {isFrozen ? <span className="font-medium text-muted-foreground">gelé</span> : null}
    </Pill>
  )
}

export function NutritionHomeSummaryTile() {
  const today = toDateKey(new Date())
  const { data: settings, isLoading: settingsLoading } = useNutritionSettings()
  const { data: daySummary, isLoading: dayLoading } = useNutritionDay(today, settings)
  const {
    streak,
    isFrozen,
    recoveryProgress,
    isLoading: streakLoading,
  } = useNutritionStreak(settings?.daily_calorie_target ?? 0)

  const isLoading = settingsLoading || (Boolean(settings?.onboarded_at) && dayLoading)
  const isOnboarded = Boolean(settings?.onboarded_at)
  const consumed = Math.round(daySummary?.totals.calories ?? 0)
  const target = daySummary?.targets.calories ?? settings?.daily_calorie_target ?? 0
  const remaining = Math.round(daySummary?.remainingCalories ?? target)
  const overTarget = isOnboarded && remaining < 0
  const progress = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const progressLabel = target > 0 ? Math.round((consumed / target) * 100) : 0

  return (
    <HomeSummaryTile
      to="/app/diet"
      search={{ date: today }}
      ariaLabel="Ouvrir le journal nutrition"
      icon={UtensilsCrossed}
      title="Diète aujourd'hui"
      iconClassName="bg-secondary/20 text-secondary dark:text-emerald-300"
      headerAddon={
        !streakLoading && isOnboarded ? (
          <DietStreakBadge
            streak={streak}
            isFrozen={isFrozen}
            recoveryProgress={recoveryProgress}
          />
        ) : null
      }
    >
      {isLoading ? (
        <HomeSummaryTileSkeleton />
      ) : !isOnboarded ? (
        <p className="text-sm text-muted-foreground">
          Configurez vos objectifs pour suivre vos calories.
        </p>
      ) : (
        <>
          <HomeSummaryMetricsRow>
            <HomeSummaryMetric value={formatCalories(consumed)} label="cons." />
            <HomeSummaryMetric
              value={
                overTarget
                  ? `+${formatCalories(Math.abs(remaining))}`
                  : formatCalories(remaining)
              }
              label={overTarget ? 'dep.' : 'rest.'}
              tone={overTarget ? 'danger' : 'accent'}
              className="text-right"
            />
          </HomeSummaryMetricsRow>

          <HomeSummaryProgress
            value={progress}
            className="[&_[data-slot=progress-indicator]]:bg-secondary"
          />

          <HomeSummaryTileFooter
            left={`Objectif ${formatCalories(target)} kcal`}
            right={`${progressLabel}% atteint`}
            rightClassName="text-secondary dark:text-emerald-300"
          />
        </>
      )}
    </HomeSummaryTile>
  )
}
