import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createPlanningCalendarComponents } from '@/components/schedule/PlanningCalendarDay'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { WeeklyStreakIndicator } from '@/components/schedule/WeeklyStreakBadge'
import { Pill } from '@/design-system'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import {
  getMarkerKind,
  type CalendarMarkers,
  type DayMarker,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

const navButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-soft-primary hover:text-soft-primary-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export type WorkoutCalendarProps = {
  markers: CalendarMarkers
  nutritionDays?: Map<string, NutritionDayAggregate>
  showNutrition?: boolean
  mode?: 'compact' | 'full'
  embedded?: boolean
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  month?: Date
  onMonthChange?: (month: Date) => void
  className?: string
  streak?: number
}

function markerDates(markers: CalendarMarkers, kinds: string[]): Date[] {
  const dates: Date[] = []

  for (const marker of markers.values()) {
    const kind = getMarkerKind(marker)
    if (kind && kinds.includes(kind)) {
      dates.push(parseISO(`${marker.date}T12:00:00`))
    }
  }

  return dates
}

function CalendarLegend({ showNutrition = false }: { showNutrition?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Sport</p>
        <div className="flex flex-wrap items-center gap-2">          <Pill tone="primary" className="gap-1.5 py-1.5 pl-2 pr-3">
            <span className="h-1 w-4 rounded-full bg-primary" />
            Séance réalisée
          </Pill>
          <Pill tone="secondary" className="gap-1.5 py-1.5 pl-2 pr-3">
            <span className="h-1 w-4 rounded-full bg-secondary" />
            Séance planifiée
          </Pill>
          <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
            <span className="h-1 w-4 rounded-full bg-muted-foreground/35" />
            Séance manquée
          </Pill>
        </div>
      </div>
      {showNutrition ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-medium text-foreground">Diète</p>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-soft-secondary text-xs font-bold text-secondary-foreground ring-1 ring-secondary/25">
                12
              </span>
              Objectif respecté
            </Pill>
            <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--destructive)_16%,var(--card))] text-xs font-bold text-destructive ring-1 ring-destructive/20">
                12
              </span>
              Objectif dépassé
            </Pill>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function WorkoutCalendar({
  markers,
  nutritionDays,
  showNutrition = false,
  mode = 'compact',
  embedded = false,
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  className,
  streak,
}: WorkoutCalendarProps) {
  const [internalSelected, setInternalSelected] = useState<Date | undefined>(
    onSelect ? selected : (selected ?? new Date()),
  )

  const currentSelected = onSelect ? selected : (selected ?? internalSelected)

  const [internalMonth, setInternalMonth] = useState(
    () => controlledMonth ?? currentSelected ?? new Date(),
  )
  const displayMonth = controlledMonth ?? internalMonth
  const previousSelectedRef = useRef<Date | undefined>(currentSelected)
  const [legendOpen, setLegendOpen] = useState(false)
  function setDisplayMonth(monthOrUpdater: Date | ((month: Date) => Date)) {
    const nextMonth =
      typeof monthOrUpdater === 'function'
        ? monthOrUpdater(displayMonth)
        : monthOrUpdater

    if (controlledMonth === undefined) {
      setInternalMonth(nextMonth)
    }
    onMonthChange?.(nextMonth)
  }

  useEffect(() => {
    if (!currentSelected) {
      previousSelectedRef.current = currentSelected
      return
    }

    const selectedChanged =
      previousSelectedRef.current?.getTime() !== currentSelected.getTime()
    previousSelectedRef.current = currentSelected

    if (!selectedChanged) {
      return
    }

    const selectedMonth = startOfMonth(currentSelected)
    const activeMonth = startOfMonth(displayMonth)

    if (selectedMonth.getTime() === activeMonth.getTime()) {
      return
    }

    if (controlledMonth !== undefined) {
      onMonthChange?.(selectedMonth)
      return
    }

    setInternalMonth(selectedMonth)
  }, [controlledMonth, currentSelected, displayMonth, onMonthChange])

  const modifiers = useMemo(
    () => ({
      done: markerDates(markers, ['done', 'mixed']),
      planned: markerDates(markers, ['planned', 'mixed']),
      missed: markerDates(markers, ['missed']),
      mixed: markerDates(markers, ['mixed']),
    }),
    [markers],
  )

  const planningComponents = useMemo(
    () =>
      createPlanningCalendarComponents({
        markers,
        nutritionDays,
        showNutrition,
        compact: mode === 'compact',
      }),
    [markers, nutritionDays, showNutrition, mode],
  )

  function handleSelect(date: Date | undefined) {
    if (onSelect) {
      onSelect(date)
      return
    }

    setInternalSelected(date)
  }

  return (
    <div className={cn('w-full', !embedded && 'space-y-3', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden',
          embedded
            ? 'px-0 py-0'
            : mode === 'compact'
              ? 'rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-soft-purple/20 px-2 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-3'
              : 'rounded-2xl border border-border/60 bg-muted/15 px-3 py-4 sm:px-4',
        )}
      >
        {mode === 'compact' && !embedded ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-soft-primary/25 to-transparent"
            aria-hidden
          />
        ) : null}

        <div className="relative mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1">
          <div aria-hidden />

          <div className="flex items-center gap-1">            <button
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

          <div className="flex items-center justify-end gap-1.5">
            {mode === 'full' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-full text-muted-foreground hover:bg-soft-primary hover:text-soft-primary-fg"
                aria-label="Légende du calendrier"
                onClick={() => setLegendOpen(true)}
              >
                <CircleHelp className="size-4" />
              </Button>
            ) : null}
            {streak != null ? (
              <WeeklyStreakIndicator streak={streak} />
            ) : null}
          </div>        </div>

        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={currentSelected}
          onSelect={handleSelect}
          locale={fr}
          modifiers={modifiers}
          components={planningComponents}
          className="relative border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      {mode === 'full' ? (
        <Drawer open={legendOpen} onOpenChange={setLegendOpen}>
          <DrawerContent className="max-h-[85vh] rounded-t-3xl">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display font-black">
                Légende du calendrier
              </DrawerTitle>
              <DrawerDescription>
                Couleurs des jours (diète) et pastilles sous les dates (sport).
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <CalendarLegend showNutrition={showNutrition} />
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  )
}
export function formatDayMarkerTitle(_marker: DayMarker | undefined, date: Date) {
  return format(date, "EEEE d MMMM", { locale: fr })
}

export function getDayMarker(
  markers: CalendarMarkers,
  date: Date,
): DayMarker | undefined {
  const key = format(date, 'yyyy-MM-dd')
  return markers.get(key)
}
