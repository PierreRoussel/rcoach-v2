import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo, useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { WeeklyStreakIndicator } from '@/components/schedule/WeeklyStreakBadge'
import {
  getMarkerKind,
  type CalendarMarkers,
  type DayMarker,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

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
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary" />
        Realise
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-secondary" />
        Planifie
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-muted-foreground/50" />
        Manque
      </span>
    </div>
  )
}

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

  const modifiers = useMemo(
    () => ({
      done: markerDates(markers, ['done', 'mixed']),
      planned: markerDates(markers, ['planned', 'mixed']),
      missed: markerDates(markers, ['missed']),
    }),
    [markers],
  )

  const markerDotClass =
    'relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:content-[""]'

  function handleSelect(date: Date | undefined) {
    if (onSelect) {
      onSelect(date)
      return
    }

    setInternalSelected(date)
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="relative w-full">
        {streak != null ? (
          <div className="absolute right-2 top-2 z-10">
            <WeeklyStreakIndicator streak={streak} />
          </div>
        ) : null}
        <Calendar
          mode="single"
          selected={currentSelected}
          onSelect={handleSelect}
          locale={fr}
          modifiers={modifiers}
          modifiersClassNames={{
            done: cn(
              markerDotClass,
              'after:bg-primary aria-selected:after:hidden',
            ),
            planned: cn(
              markerDotClass,
              'after:bg-secondary aria-selected:after:hidden',
            ),
            missed:
              'text-muted-foreground/60 [&_button]:line-through [&_button]:decoration-muted-foreground/40',
          }}
          classNames={{
            today: cn(
              'font-semibold bg-primary/10 text-foreground ring-1 ring-inset ring-primary/25',
              '[&_button]:font-semibold',
              'aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:ring-0',
              'aria-selected:[&_button]:text-primary-foreground',
            ),
            selected: cn(
              'rounded-md bg-primary text-primary-foreground ring-0',
              '[&_button]:bg-transparent [&_button]:text-primary-foreground',
              '[&_button]:hover:bg-transparent [&_button]:hover:text-primary-foreground',
            ),
          }}
          className={cn(
            'w-full rounded-2xl border border-border bg-card',
            mode === 'compact' ? 'px-1 py-2' : 'p-2',
            streak != null ? 'pt-10' : null,
          )}
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
