import { format, isAfter, isBefore, parseISO, startOfDay, endOfMonth, startOfMonth } from 'date-fns'

import type { CalendarWorkoutSummary } from '@/lib/graphql/operations'
import {
  datesMatchWorkoutDay,
  expandAllOccurrences,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'
import {
  isCompletedWorkout,
  occurrenceIsFulfilled,
} from '@/lib/schedule/occurrence-fulfillment'

export type DayMarkerKind = 'done' | 'planned' | 'missed' | 'mixed'

export type DayMarker = {
  date: string
  kinds: Set<DayMarkerKind>
  workouts: CalendarWorkoutSummary[]
  planned: ScheduleOccurrence[]
}

export type CalendarMarkers = Map<string, DayMarker>

function emptyMarker(date: string): DayMarker {
  return {
    date,
    kinds: new Set(),
    workouts: [],
    planned: [],
  }
}

function recomputeSpontaneousDoneKind(marker: DayMarker) {
  if (marker.planned.length > 0) {
    return
  }

  if (marker.workouts.some(isCompletedWorkout)) {
    marker.kinds.add('done')
  }
}

export function buildCalendarMarkers(
  workouts: CalendarWorkoutSummary[],
  sessions: ScheduledSession[],
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
): CalendarMarkers {
  const markers = new Map<string, DayMarker>()
  const today = startOfDay(now)

  for (const workout of workouts) {
    const date = format(parseISO(workout.started_at), 'yyyy-MM-dd')
    const marker = markers.get(date) ?? emptyMarker(date)
    marker.workouts.push(workout)
    markers.set(date, marker)
  }

  const planned = expandAllOccurrences(sessions, rangeStart, rangeEnd)

  for (const occurrence of planned) {
    const marker = markers.get(occurrence.date) ?? emptyMarker(occurrence.date)
    marker.planned.push(occurrence)

    const day = startOfDay(parseISO(`${occurrence.date}T12:00:00`))
    const fulfilled = occurrenceIsFulfilled(marker.workouts, occurrence)

    if (fulfilled) {
      marker.kinds.add('done')
    } else if (isBefore(day, today)) {
      marker.kinds.add('missed')
    } else {
      marker.kinds.add('planned')
    }

    markers.set(occurrence.date, marker)
  }

  for (const marker of markers.values()) {
    recomputeSpontaneousDoneKind(marker)
  }

  return markers
}

export function getMarkerKind(marker: DayMarker | undefined): DayMarkerKind | null {
  if (!marker || marker.kinds.size === 0) {
    return null
  }

  if (marker.kinds.has('missed')) {
    return 'missed'
  }

  if (marker.kinds.has('done')) {
    return 'done'
  }

  if (marker.kinds.has('planned')) {
    return 'planned'
  }

  return null
}

export function markerDatesWithKind(
  markers: CalendarMarkers,
  kind: DayMarkerKind,
): Date[] {
  const dates: Date[] = []

  for (const marker of markers.values()) {
    if (marker.kinds.has(kind)) {
      dates.push(parseISO(`${marker.date}T12:00:00`))
    }
  }

  return dates
}

export function workoutMatchesDay(workout: CalendarWorkoutSummary, date: Date): boolean {
  return datesMatchWorkoutDay(workout.started_at, date)
}

export function monthCalendarRange(month: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(month),
    end: endOfMonth(month),
  }
}

export function defaultCalendarRange(now = new Date()): { start: Date; end: Date } {
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 3, 1))
  const end = startOfDay(new Date(now.getFullYear(), now.getMonth() + 4, 0))
  return { start, end }
}

export function isDateInFuture(date: Date, now = new Date()): boolean {
  return isAfter(startOfDay(date), startOfDay(now))
}

export function isPastCalendarDay(date: Date, now = new Date()): boolean {
  return isBefore(startOfDay(date), startOfDay(now))
}

export function canStartPlannedOccurrence(
  date: Date,
  marker: Pick<DayMarker, 'workouts' | 'planned'> | undefined,
  occurrence?: ScheduleOccurrence,
  now = new Date(),
): boolean {
  if (isPastCalendarDay(date, now)) {
    return false
  }

  if (occurrence) {
    return !occurrenceIsFulfilled(marker?.workouts ?? [], occurrence)
  }

  if (!marker?.planned.length) {
    return true
  }

  return marker.planned.some(
    (plannedOccurrence) =>
      !occurrenceIsFulfilled(marker.workouts, plannedOccurrence),
  )
}

export function calendarDayTimestamp(date: Date, hour = 12): Date {
  const day = startOfDay(date)
  day.setHours(hour, 0, 0, 0)
  return day
}
