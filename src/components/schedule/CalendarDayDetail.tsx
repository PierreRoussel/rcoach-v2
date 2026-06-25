import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarClock, CalendarDays, Dumbbell, Play } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  formatDayMarkerTitle,
  getDayMarker,
  WorkoutCalendar,
  type WorkoutCalendarProps,
} from '@/components/schedule/WorkoutCalendar'
import { Pill } from '@/design-system'
import type { CalendarMarkers } from '@/lib/schedule/calendar-markers'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { cn } from '@/lib/utils'

type CalendarDayDetailProps = {
  markers: CalendarMarkers
  date: Date
  onStartPlanned?: (occurrence: ScheduleOccurrence) => void
  onPlanDate?: (date: Date) => void
  isStarting?: boolean
}

export function CalendarDayDetail({
  markers,
  date,
  onStartPlanned,
  onPlanDate,
  isStarting = false,
}: CalendarDayDetailProps) {
  const marker = getDayMarker(markers, date)
  const hasContent = Boolean(marker?.workouts.length || marker?.planned.length)

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-top-2 space-y-4 rounded-2xl border border-border/70',
        'bg-gradient-to-b from-card to-soft-purple/10 p-4 shadow-sm duration-300',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-display text-lg font-black capitalize leading-tight text-foreground">
            {formatDayMarkerTitle(marker, date)}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasContent
              ? 'Détail de la journée sélectionnée'
              : 'Aucune séance pour ce jour'}
          </p>
        </div>
        <Pill tone="purple" className="shrink-0 py-1">
          <CalendarDays className="size-3" />
          Jour
        </Pill>
      </div>

      {marker?.workouts.length ? (
        <section className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Réalisé
          </p>
          <ul className="space-y-2">
            {marker.workouts.map((workout) => (
              <li
                key={workout.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-soft-primary/25 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{workout.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(workout.started_at), 'HH:mm', { locale: fr })}
                  </p>
                </div>
                <Button variant="pill" size="sm" className="shrink-0 rounded-full" asChild>
                  <Link to="/app/workouts/$workoutId" params={{ workoutId: workout.id }}>
                    Voir
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {marker?.planned.length ? (
        <section className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Planifié
          </p>
          <ul className="space-y-2">
            {marker.planned.map((occurrence) => (
              <li
                key={`${occurrence.sessionId}-${occurrence.date}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-secondary/35 bg-soft-secondary/35 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{occurrence.title}</p>
                  {occurrence.workoutTemplateName ? (
                    <p className="text-xs text-muted-foreground">
                      {occurrence.workoutTemplateName}
                    </p>
                  ) : null}
                </div>
                {onStartPlanned ? (
                  <Button
                    type="button"
                    variant="pill"
                    size="sm"
                    className="shrink-0 rounded-full"
                    disabled={isStarting}
                    onClick={() => onStartPlanned(occurrence)}
                  >
                    <Play className="size-3" />
                    Go
                  </Button>
                ) : (
                  <CalendarClock className="size-4 shrink-0 text-secondary" />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!hasContent ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
          <Dumbbell className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Rien de prévu pour ce jour.</p>
        </div>
      ) : null}

      {onPlanDate ? (
        <Button
          type="button"
          variant="soft"
          size="sm"
          className="w-full rounded-full"
          onClick={() => onPlanDate(date)}
        >
          <CalendarClock className="size-4" />
          Planifier une séance
        </Button>
      ) : null}
    </div>
  )
}

type WorkoutCalendarPanelProps = WorkoutCalendarProps & {
  markers: CalendarMarkers
  onStartPlanned?: (occurrence: ScheduleOccurrence) => void
  onPlanDate?: (date: Date) => void
  isStarting?: boolean
}

export function WorkoutCalendarPanel({
  markers,
  onStartPlanned,
  onPlanDate,
  isStarting,
  streak,
  mode = 'compact',
  className,
  ...calendarProps
}: WorkoutCalendarPanelProps) {
  const [selected, setSelected] = useState<Date | undefined>(
    mode === 'full' ? new Date() : undefined,
  )

  return (
    <div className={cn('space-y-4', className)}>
      <WorkoutCalendar
        {...calendarProps}
        markers={markers}
        mode={mode}
        streak={streak}
        selected={selected}
        onSelect={setSelected}
      />
      {selected ? (
        <CalendarDayDetail
          markers={markers}
          date={selected}
          onStartPlanned={onStartPlanned}
          onPlanDate={onPlanDate}
          isStarting={isStarting}
        />
      ) : null}
    </div>
  )
}
