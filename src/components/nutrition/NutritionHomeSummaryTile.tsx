import { Link } from '@tanstack/react-router'
import { ChevronRight, Flame, Snowflake, UtensilsCrossed } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { Pill } from '@/design-system'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { toDateKey } from '@/lib/nutrition/dates'
import { cn } from '@/lib/utils'

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
      tone={isFrozen ? 'default' : 'solid-primary'}
      className="h-6 shrink-0 gap-1 px-2 py-0 text-[11px] font-bold"
      title={
        isFrozen
          ? `Série gelée : ${streak} jour${streak > 1 ? 's' : ''}${recoveryProgress != null ? ` — recovery ${recoveryProgress}/2` : ''}`
          : `Série : ${streak} jour${streak > 1 ? 's' : ''}`
      }
    >
      {isFrozen ? (
        <Snowflake className="size-3 text-sky-500" aria-hidden />
      ) : (
        <Flame className="size-3 fill-current" aria-hidden />
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

  return (
    <Link
      to="/app/diet"
      search={{ date: today }}
      className={cn(
        'block rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-sm',
        'transition-colors active:bg-muted/40',
      )}
      aria-label="Ouvrir le journal nutrition"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft-primary text-primary">
          <UtensilsCrossed className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-foreground">Diète aujourd'hui</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {!streakLoading && isOnboarded ? (
                <DietStreakBadge
                  streak={streak}
                  isFrozen={isFrozen}
                  recoveryProgress={recoveryProgress}
                />
              ) : null}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </div>

          {isLoading ? (
            <div className="mt-2 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-1.5 animate-pulse rounded-full bg-muted" />
            </div>
          ) : !isOnboarded ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Configurez vos objectifs pour suivre vos calories.
            </p>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span>
                  <span className="font-display text-base font-black tabular-nums text-foreground">
                    {consumed}
                  </span>
                  <span className="ml-1 text-muted-foreground">cons.</span>
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>
                  <span
                    className={cn(
                      'font-display text-base font-black tabular-nums',
                      overTarget ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {overTarget ? `+${Math.abs(remaining)}` : remaining}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {overTarget ? 'dep.' : 'rest.'}
                  </span>
                </span>
              </div>
              <Progress value={progress} className="mt-2 h-1.5 bg-muted" />
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
