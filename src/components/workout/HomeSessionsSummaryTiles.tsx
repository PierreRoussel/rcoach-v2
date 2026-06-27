import { useMemo, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronRight, Clock, Dumbbell, History } from 'lucide-react'

import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useMyLastCompletedWorkout } from '@/hooks/useWorkouts'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import {
  getNextScheduledOccurrence,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'
import { formatRelativeScheduleDate, isScheduleDateToday } from '@/lib/schedule/format-relative-schedule-date'
import {
  computeWorkoutVolume,
  formatWorkoutDateTime,
  formatWorkoutDuration,
  formatWorkoutVolume,
} from '@/lib/stats/workout-metrics'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_EXERCISES = 2

function formatOccurrenceSchedule(date: string, timeLocal: string | null) {
  const relative = formatRelativeScheduleDate(date)
  if (!timeLocal) {
    return relative
  }

  const [hours, minutes] = timeLocal.split(':')
  if (!hours || !minutes) {
    return relative
  }

  return `${relative} · ${hours}h${minutes}`
}

function buildExercisePreview(workout: WorkoutSummary) {
  const visible = workout.workout_exercises.slice(0, MAX_VISIBLE_EXERCISES)
  const hiddenCount = workout.workout_exercises.length - visible.length

  return {
    entries: visible.map((entry) => ({
      exercise: entry.exercise,
      setCount: entry.sets.length,
    })),
    hiddenCount,
  }
}

type SessionSummaryTileProps = {
  title: string
  icon: typeof History
  tone: 'primary' | 'secondary'
  highlighted?: boolean
  children: ReactNode
  to: string
  params?: Record<string, string>
  search?: Record<string, string>
  ariaLabel: string
}

function SessionSummaryTile({
  title,
  icon: Icon,
  tone,
  highlighted = false,
  children,
  to,
  params,
  search,
  ariaLabel,
}: SessionSummaryTileProps) {
  const iconClass = highlighted
    ? 'bg-primary/15 text-primary'
    : tone === 'primary'
      ? 'bg-soft-primary text-primary'
      : 'bg-soft-secondary text-secondary-foreground'

  return (
    <Link
      to={to}
      params={params}
      search={search}
      className={cn(
        'flex min-h-[9.5rem] flex-col rounded-2xl px-3 py-3 shadow-sm transition-colors',
        highlighted
          ? 'border border-primary/35 bg-gradient-to-br from-soft-primary via-card to-soft-accent active:opacity-90'
          : 'border border-border/70 bg-card active:bg-muted/40',
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              iconClass,
            )}
          >
            <Icon className="size-3.5" />
          </div>
          <p className="font-display text-xs font-bold text-foreground">{title}</p>
        </div>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-2 min-w-0 flex-1">{children}</div>
    </Link>
  )
}

function SessionTileSkeleton() {
  return (
    <div className="min-h-[9.5rem] rounded-2xl border border-border/70 bg-card px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

function LastSessionTile({
  workout,
}: {
  workout: WorkoutSummary | null
}) {
  if (!workout) {
    return (
      <SessionSummaryTile
        title="Dernière séance"
        icon={History}
        tone="primary"
        to="/app/workout/active"
        ariaLabel="Démarrer une séance"
      >
        <p className="text-sm text-muted-foreground">
          Aucune séance terminée pour le moment.
        </p>
        <p className="mt-2 text-xs font-medium text-primary">Démarrer une séance</p>
      </SessionSummaryTile>
    )
  }

  const duration = formatWorkoutDuration(workout.started_at, workout.ended_at)
  const volume = formatWorkoutVolume(computeWorkoutVolume(workout))
  const preview = buildExercisePreview(workout)

  return (
    <SessionSummaryTile
      title="Dernière séance"
      icon={History}
      tone="primary"
      to="/app/workouts/$workoutId"
      params={{ workoutId: workout.id }}
      ariaLabel={`Voir la dernière séance ${workout.title}`}
    >
      <p className="truncate font-display text-sm font-black text-foreground">
        {workout.title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {formatWorkoutDateTime(workout.started_at)}
      </p>
      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {duration ?? '—'} · {volume}
      </p>
      {preview.entries.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {preview.entries.map((entry) => (
            <li
              key={entry.exercise.id}
              className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"
            >
              <Dumbbell className="size-3 shrink-0 text-primary/70" />
              <span className="truncate">
                {entry.setCount} série{entry.setCount > 1 ? 's' : ''} ·{' '}
                <DisplayExerciseName
                  name={entry.exercise.name}
                  nameFr={entry.exercise.name_fr}
                  exerciseId={entry.exercise.id}
                />
              </span>
            </li>
          ))}
          {preview.hiddenCount > 0 ? (
            <li className="pl-4 text-[10px] text-muted-foreground">
              +{preview.hiddenCount} exercice{preview.hiddenCount > 1 ? 's' : ''}
            </li>
          ) : null}
        </ul>
      ) : null}
    </SessionSummaryTile>
  )
}

function NextSessionTile({
  scheduleAvailable,
  nextOccurrence,
}: {
  scheduleAvailable: boolean
  nextOccurrence: ScheduleOccurrence | null
}) {
  if (!scheduleAvailable) {
    return (
      <SessionSummaryTile
        title="Prochaine séance"
        icon={CalendarDays}
        tone="secondary"
        to="/app/planning"
        ariaLabel="Ouvrir le planning"
      >
        <p className="text-sm text-muted-foreground">
          Le planning n&apos;est pas encore disponible.
        </p>
      </SessionSummaryTile>
    )
  }

  if (!nextOccurrence) {
    return (
      <SessionSummaryTile
        title="Prochaine séance"
        icon={CalendarDays}
        tone="secondary"
        to="/app/planning"
        ariaLabel="Planifier une séance"
      >
        <p className="text-sm text-muted-foreground">Aucune séance planifiée.</p>
        <p className="mt-2 text-xs font-medium text-secondary-foreground">
          Ajouter au planning
        </p>
      </SessionSummaryTile>
    )
  }

  const scheduleLabel = formatOccurrenceSchedule(
    nextOccurrence.date,
    nextOccurrence.timeLocal,
  )
  const isToday = isScheduleDateToday(nextOccurrence.date)

  return (
    <SessionSummaryTile
      title="Prochaine séance"
      icon={CalendarDays}
      tone="secondary"
      highlighted={isToday}
      to="/app/planning"
      ariaLabel={`Voir la prochaine séance ${nextOccurrence.title}`}
    >
      <p className="truncate font-display text-sm font-black text-foreground">
        {nextOccurrence.title}
      </p>
      <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground">
        <Clock className="size-3 shrink-0" />
        {scheduleLabel}
      </p>
      {nextOccurrence.workoutTemplateName ? (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {nextOccurrence.workoutTemplateName}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Séance libre</p>
      )}
    </SessionSummaryTile>
  )
}

export function HomeSessionsSummaryTiles() {
  const { data: lastWorkout = null, isLoading: lastWorkoutLoading } =
    useMyLastCompletedWorkout()
  const {
    data: sessionsResult,
    isLoading: sessionsLoading,
  } = useScheduledSessions()
  const sessions = sessionsResult?.sessions ?? []
  const scheduleAvailable = sessionsResult?.deployed ?? true

  const isLoading = lastWorkoutLoading || sessionsLoading
  const nextOccurrence = useMemo(
    () =>
      getNextScheduledOccurrence(sessions, {
        completedWorkouts: lastWorkout ? [lastWorkout] : [],
      }),
    [sessions, lastWorkout],
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="font-display text-sm font-bold text-foreground">Séances</p>
        <Link
          to="/app/sessions"
          search={{ tab: 'history' }}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Voir tout
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          <>
            <SessionTileSkeleton />
            <SessionTileSkeleton />
          </>
        ) : (
          <>
            <LastSessionTile workout={lastWorkout} />
            <NextSessionTile
              scheduleAvailable={scheduleAvailable}
              nextOccurrence={nextOccurrence}
            />
          </>
        )}
      </div>
    </div>
  )
}
