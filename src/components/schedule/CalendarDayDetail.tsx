import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarClock, Dumbbell, Play } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  formatDayMarkerTitle,
  getDayMarker,
  WorkoutCalendar,
  type WorkoutCalendarProps,
} from '@/components/schedule/WorkoutCalendar'
import type { CalendarMarkers } from '@/lib/schedule/calendar-markers'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'

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

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
      <p className="font-display text-sm font-black text-foreground">
        {formatDayMarkerTitle(marker, date)}
      </p>

      {marker?.workouts.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Realise
          </p>
          <ul className="space-y-2">
            {marker.workouts.map((workout) => (
              <li
                key={workout.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{workout.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(workout.started_at), 'HH:mm', { locale: fr })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link to="/app/workouts/$workoutId" params={{ workoutId: workout.id }}>
                    Voir
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {marker?.planned.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Planifie
          </p>
          <ul className="space-y-2">
            {marker.planned.map((occurrence) => (
              <li
                key={`${occurrence.sessionId}-${occurrence.date}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-secondary/50 bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{occurrence.title}</p>
                  {occurrence.workoutTemplateName ? (
                    <p className="text-xs text-muted-foreground">
                      Modele : {occurrence.workoutTemplateName}
                    </p>
                  ) : null}
                </div>
                {onStartPlanned ? (
                  <Button
                    type="button"
                    variant="pill"
                    size="sm"
                    disabled={isStarting}
                    onClick={() => onStartPlanned(occurrence)}
                  >
                    <Play className="size-3" />
                    Demarrer
                  </Button>
                ) : (
                  <CalendarClock className="size-4 shrink-0 text-secondary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!marker?.workouts.length && !marker?.planned.length ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Dumbbell className="size-4" />
          Rien de prevu pour ce jour.
        </p>
      ) : null}

      {onPlanDate ? (
        <Button
          type="button"
          variant="soft"
          size="sm"
          className="w-full rounded-xl"
          onClick={() => onPlanDate(date)}
        >
          <CalendarClock className="size-4" />
          Planifier une seance ce jour
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
  ...calendarProps
}: WorkoutCalendarPanelProps) {
  const [selected, setSelected] = useState<Date | undefined>(
    mode === 'full' ? new Date() : undefined,
  )

  return (
    <div className="space-y-3">
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
