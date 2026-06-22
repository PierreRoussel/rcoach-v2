import { addMonths, format, parseISO, subMonths } from 'date-fns'
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
        Realise
      </Pill>
      <Pill tone="secondary" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="size-2 rounded-full bg-secondary shadow-sm shadow-secondary/30" />
        Planifie
      </Pill>
      <Pill tone="default" className="gap-1.5 py-1.5 pl-2 pr-3">
        <span className="size-2 rounded-full bg-muted-foreground/45" />
        Manque
      </Pill>
    </div>
  )
}

/** Bottom dot on the day number — hidden when the day is selected. */
const markerDot =
  '[&_button]:before:absolute [&_button]:before:bottom-0.5 [&_button]:before:left-1/2 [&_button]:before:size-1.5 [&_button]:before:-translate-x-1/2 [&_button]:before:rounded-full [&_button]:before:content-[""]'

const dayButtonWhenSelected =
  'aria-selected:[&_button]:before:hidden aria-selected:[&_button]:bg-transparent aria-selected:[&_button]:text-inherit'

const mixedDayStyle =
  '[&.done.planned]:[&_button]:bg-gradient-to-br [&.done.planned]:[&_button]:from-soft-primary [&.done.planned]:[&_button]:to-soft-secondary/80 [&.done.planned]:[&_button]:before:w-3 [&.done.planned]:[&_button]:before:bg-gradient-to-r [&.done.planned]:[&_button]:before:from-primary [&.done.planned]:[&_button]:to-secondary'

export function WorkoutCalendar({
  markers,
  mode = 'compact',
  selected,
  onSelect,
  className,
  streak,
}: WorkoutCalendarProps) {
  const [internalSelected, setInternalSelected] = useState<Date | undefined>(
    onSelect ? selected : (selected ?? new Date()),
  )

  const currentSelected = onSelect ? selected : (selected ?? internalSelected)

  const [displayMonth, setDisplayMonth] = useState(
    () => currentSelected ?? new Date(),
  )

  useEffect(() => {
    if (currentSelected) {
      setDisplayMonth(currentSelected)
    }
  }, [currentSelected?.getFullYear(), currentSelected?.getMonth()])

  const modifiers = useMemo(
    () => ({
      done: markerDates(markers, ['done', 'mixed']),
      planned: markerDates(markers, ['planned', 'mixed']),
      missed: markerDates(markers, ['missed']),
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

        <div className="relative mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              className={navButtonClass}
              aria-label="Mois precedent"
              onClick={() => setDisplayMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-[8.5rem] truncate px-1 text-center font-display text-lg font-black capitalize tracking-tight text-foreground">
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

          {streak != null ? (
            <WeeklyStreakIndicator streak={streak} className="shrink-0" />
          ) : null}
        </div>

        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={currentSelected}
          onSelect={handleSelect}
          locale={fr}
          modifiers={modifiers}
          modifiersClassNames={{
            done: cn(
              '[&_button]:bg-soft-primary/80 [&_button]:text-primary',
              markerDot,
              '[&_button]:before:bg-primary',
              mixedDayStyle,
              dayButtonWhenSelected,
            ),
            planned: cn(
              '[&_button]:bg-soft-secondary/70 [&_button]:text-[#2d6b52]',
              markerDot,
              '[&_button]:before:bg-secondary',
              mixedDayStyle,
              dayButtonWhenSelected,
            ),
            missed: cn(
              '[&_button]:text-muted-foreground/40',
              '[&_button]:line-through [&_button]:decoration-muted-foreground/35',
              dayButtonWhenSelected,
            ),
          }}
          classNames={{
            today: cn(
              '[&_button]:ring-2 [&_button]:ring-primary/40 [&_button]:ring-offset-2 [&_button]:ring-offset-card',
              '[&_button]:bg-soft-primary/50 [&_button]:text-primary',
              'aria-selected:[&_button]:ring-offset-primary aria-selected:[&_button]:ring-primary-foreground/30',
              dayButtonWhenSelected,
            ),
            selected: cn(
              'rounded-full bg-primary text-primary-foreground',
              'shadow-lg shadow-primary/35',
              '[&_button]:bg-transparent [&_button]:font-black [&_button]:text-primary-foreground',
              '[&_button]:hover:bg-transparent [&_button]:hover:text-primary-foreground',
            ),
            outside: cn(
              '[&_button]:text-muted-foreground/25 [&_button]:hover:bg-transparent',
            ),
          }}
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
