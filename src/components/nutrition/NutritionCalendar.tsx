import { addMonths, format, parseISO, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Pill } from '@/design-system'
import { useNutritionCalendarMonth } from '@/hooks/useNutritionStreak'
import { toDateKey } from '@/lib/nutrition/dates'
import { computeMonthOnTargetSummary } from '@/lib/nutrition/streak'
import { cn } from '@/lib/utils'

const navButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-soft-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type NutritionCalendarProps = {
  dailyTarget: number
  streak: number
  isFrozen?: boolean
  className?: string
}

function markerDates(
  dayMap: Map<string, { status: string }>,
  status: 'on_target' | 'over_target',
): Date[] {
  const dates: Date[] = []

  for (const [date, aggregate] of dayMap.entries()) {
    if (aggregate.status === status) {
      dates.push(parseISO(`${date}T12:00:00`))
    }
  }

  return dates
}

function NutritionCalendarLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <span className="text-[0.5rem] font-bold">✓</span>
        </span>
        Objectif respecté
      </Pill>
      <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-destructive text-white">
          <span className="text-[0.5rem] font-bold">✕</span>
        </span>
        Objectif dépassé
      </Pill>
    </div>
  )
}

export function NutritionCalendar({
  dailyTarget,
  streak,
  isFrozen = false,
  className,
}: NutritionCalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [displayMonth, setDisplayMonth] = useState(() => new Date())

  const { dayMap } = useNutritionCalendarMonth(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
    dailyTarget,
  )

  useEffect(() => {
    if (selected) {
      setDisplayMonth(selected)
    }
  }, [selected?.getFullYear(), selected?.getMonth()])

  const modifiers = useMemo(
    () => ({
      nutritionOk: markerDates(dayMap, 'on_target'),
      nutritionOver: markerDates(dayMap, 'over_target'),
    }),
    [dayMap],
  )

  const monthSummary = useMemo(
    () =>
      computeMonthOnTargetSummary(
        dayMap,
        displayMonth.getFullYear(),
        displayMonth.getMonth(),
      ),
    [dayMap, displayMonth],
  )

  const selectedSummary = selected ? dayMap.get(toDateKey(selected)) : undefined

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border border-border/70',
          'bg-gradient-to-b from-card via-card to-soft-purple/20',
          'px-2 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-3',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-soft-primary/25 to-transparent"
          aria-hidden
        />

        <div className="relative mb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1">
          <div aria-hidden />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={navButtonClass}
              aria-label="Mois precedent"
              onClick={() => setDisplayMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-[7.5rem] truncate px-1 text-center font-display text-lg font-black capitalize tracking-tight text-foreground sm:min-w-[8.5rem]">
              {format(displayMonth, 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              type="button"
              className={navButtonClass}
              aria-label="Mois suivant"
              onClick={() => setDisplayMonth((month) => addMonths(month, 1))}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex justify-end">
            <Pill
              tone={isFrozen ? 'default' : 'solid-primary'}
              className="shrink-0"
              title={`${streak} jour${streak > 1 ? 's' : ''} de suite${isFrozen ? ' (gelé)' : ''}`}
            >
              <Flame className={cn('size-3', isFrozen ? '' : 'fill-current')} />
              {streak}
            </Pill>
          </div>
        </div>

        <div className="relative mb-3 px-1 text-center">
          <p
            className="text-sm text-muted-foreground"
            aria-label={`${monthSummary.onTargetDays} jours sur ${monthSummary.daysInMonth} avec objectif calorique respecté ce mois-ci`}
          >
            <span className="font-display font-bold tabular-nums text-foreground">
              {monthSummary.onTargetDays}/{monthSummary.daysInMonth}
            </span>{' '}
            objectifs respectés
          </p>
          <div
            className="mx-auto mt-1.5 h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(monthSummary.onTargetDays / monthSummary.daysInMonth) * 100}%`,
              }}
            />
          </div>
        </div>

        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={selected}
          onSelect={setSelected}
          locale={fr}
          modifiers={modifiers}
          className="relative border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <NutritionCalendarLegend />

      {selected ? (
        <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm">
          <p className="font-display font-bold capitalize text-foreground">
            {format(selected, 'EEEE d MMMM', { locale: fr })}
          </p>
          {selectedSummary?.hasLogs ? (
            <p className="mt-1 text-muted-foreground">
              {Math.round(selectedSummary.calories)} / {dailyTarget} kcal —{' '}
              {selectedSummary.status === 'on_target'
                ? 'objectif respecté'
                : 'objectif dépassé'}
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">Aucun aliment enregistré ce jour-là.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
