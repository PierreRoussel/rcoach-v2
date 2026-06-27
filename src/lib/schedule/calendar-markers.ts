import { format, isAfter, isBefore, parseISO, startOfDay, endOfMonth, startOfMonth } from 'date-fns'

import type { CalendarWorkoutSummary } from '@/lib/graphql/operations'
import {
  datesMatchWorkoutDay,
  expandAllOccurrences,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'

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
    marker.kinds.add('done')
    markers.set(date, marker)
  }

  const planned = expandAllOccurrences(sessions, rangeStart, rangeEnd)

  for (const occurrence of planned) {
    const marker = markers.get(occurrence.date) ?? emptyMarker(occurrence.date)
    marker.planned.push(occurrence)

    const day = startOfDay(parseISO(`${occurrence.date}T12:00:00`))
    const hasWorkout = marker.workouts.length > 0

    if (hasWorkout) {
      marker.kinds.add('done')
    } else if (isBefore(day, today)) {
      marker.kinds.add('missed')
    } else {
      marker.kinds.add('planned')
    }

    if (hasWorkout && marker.planned.length > 0) {
      marker.kinds.add('mixed')
    }

    markers.set(occurrence.date, marker)
  }

  return markers
}

export function getMarkerKind(marker: DayMarker | undefined): DayMarkerKind | null {
  if (!marker || marker.kinds.size === 0) {
    return null
  }

  if (marker.kinds.has('mixed') || (marker.kinds.has('done') && marker.kinds.has('planned'))) {
    return 'mixed'
  }

  if (marker.kinds.has('done')) {
    return 'done'
  }

  if (marker.kinds.has('missed')) {
    return 'missed'
  }

  if (marker.kinds.has('planned')) {
    return 'planned'
  }

  return null
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
