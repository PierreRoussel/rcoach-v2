import { Link } from '@tanstack/react-router'
import { ChevronRight, Flame, Snowflake, UtensilsCrossed } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { Pill } from '@/design-system'
import { useNutritionDay } from '@/hooks/useNutritionDay'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { toDateKey } from '@/lib/nutrition/dates'
import { cn } from '@/lib/utils'

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
  const progressLabel =
    target > 0 ? Math.round((consumed / target) * 100) : 0

  return (
    <Link
      to="/app/diet"
      search={{ date: today }}
      className={cn(
        'block rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm',
        'transition-colors active:bg-muted/40',
      )}
      aria-label="Ouvrir le journal nutrition"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft-primary text-primary">
          <UtensilsCrossed className="size-[18px]" />
        </div>

        <p className="min-w-0 flex-1 font-display text-sm font-bold text-foreground">
          Diète aujourd&apos;hui
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          {!streakLoading && isOnboarded ? (
            <DietStreakBadge
              streak={streak}
              isFrozen={isFrozen}
              recoveryProgress={recoveryProgress}
            />
          ) : null}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-7 w-56 animate-pulse rounded bg-muted" />
          <div className="h-2 animate-pulse rounded-full bg-muted" />
          <div className="flex justify-between">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ) : !isOnboarded ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Configurez vos objectifs pour suivre vos calories.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-display text-xl font-black tabular-nums text-foreground">
                {formatCalories(consumed)}
              </span>
              <span className="text-sm text-muted-foreground">cons.</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-display text-xl font-black tabular-nums',
                  overTarget ? 'text-destructive' : 'text-primary',
                )}
              >
                {overTarget ? `+${formatCalories(Math.abs(remaining))}` : formatCalories(remaining)}
              </span>
              <span className="text-sm text-muted-foreground">
                {overTarget ? 'dep.' : 'rest.'}
              </span>
            </span>
          </div>

          <Progress value={progress} className="mt-3 h-2 bg-muted" />

          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Objectif {formatCalories(target)} kcal
            </span>
            <span className="font-semibold text-primary">{progressLabel}% atteint</span>
          </div>
        </>
      )}
    </Link>
  )
}
