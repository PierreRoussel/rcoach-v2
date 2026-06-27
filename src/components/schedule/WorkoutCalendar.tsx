import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { WeeklyStreakIndicator } from '@/components/schedule/WeeklyStreakBadge'
import { Pill } from '@/design-system'
import {
  getMarkerKind,
  type CalendarMarkers,
  type DayMarker,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

const navButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-soft-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export type WorkoutCalendarProps = {
  markers: CalendarMarkers
  mode?: 'compact' | 'full'
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

function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      <Pill tone="primary" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="size-2 rounded-full bg-primary shadow-sm shadow-primary/40" />
        Réalisé
      </Pill>
      <Pill tone="secondary" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="size-2 rounded-full bg-secondary shadow-sm shadow-secondary/30" />
        Planifié
      </Pill>
      <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="size-2 rounded-full bg-muted-foreground/45" />
        Manque
      </Pill>
    </div>
  )
}

export function WorkoutCalendar({
  markers,
  mode = 'compact',
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

  function setDisplayMonth(month: Date) {
    if (!controlledMonth) {
      setInternalMonth(month)
    }
    onMonthChange?.(month)
  }

  useEffect(() => {
    if (!currentSelected) {
      return
    }

    const nextMonth = startOfMonth(currentSelected)
    if (controlledMonth) {
      onMonthChange?.(nextMonth)
      return
    }

    setInternalMonth(nextMonth)
  }, [controlledMonth, currentSelected, onMonthChange])

  const modifiers = useMemo(
    () => ({
      done: markerDates(markers, ['done', 'mixed']),
      planned: markerDates(markers, ['planned', 'mixed']),
      missed: markerDates(markers, ['missed']),
      mixed: markerDates(markers, ['mixed']),
    }),
    [markers],
  )

  function handleSelect(date: Date | undefined) {
    if (onSelect) {
      onSelect(date)
      return
    }

    setInternalSelected(date)
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border border-border/70',
          'bg-gradient-to-b from-card via-card to-soft-purple/20',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
          mode === 'compact' ? 'px-2 py-3 sm:px-3' : 'px-3 py-4 sm:px-4',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-soft-primary/25 to-transparent"
          aria-hidden
        />

        <div className="relative mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1">
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
            {streak != null ? (
              <WeeklyStreakIndicator streak={streak} />
            ) : null}
          </div>
        </div>

        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={currentSelected}
          onSelect={handleSelect}
          locale={fr}
          modifiers={modifiers}
          className="relative border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      {mode === 'full' ? <CalendarLegend /> : null}
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
