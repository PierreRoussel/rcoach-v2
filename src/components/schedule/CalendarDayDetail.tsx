import { Link } from '@tanstack/react-router'
import { format, parseISO, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  History,
  Play,
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useCreateSimpleWorkout } from '@/hooks/useWorkouts'
import {
  formatDayMarkerTitle,
  getDayMarker,
  WorkoutCalendar,
  type WorkoutCalendarProps,
} from '@/components/schedule/WorkoutCalendar'
import { Pill } from '@/design-system'
import {
  canStartPlannedOccurrence,
  isPastCalendarDay,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { cn } from '@/lib/utils'

type CalendarDayDetailProps = {
  markers: CalendarMarkers
  date: Date
  onStartPlanned?: (occurrence: ScheduleOccurrence) => void
  onPlanDate?: (date: Date) => void
  isStarting?: boolean
}

function SimplePastActivityForm({ date }: { date: Date }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createSimple = useCreateSimpleWorkout()

  useEffect(() => {
    setName('')
    setError(null)
  }, [date])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    setError(null)

    try {
      await createSimple.mutateAsync({ title: name.trim(), date })
      setName('')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'ajouter l'activité.",
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de l'activité"
          disabled={createSimple.isPending}
          className="rounded-full"
          aria-label="Nom de l'activité"
        />
        <Button
          type="submit"
          variant="pill"
          size="sm"
          className="shrink-0 rounded-full"
          disabled={createSimple.isPending}
        >
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  )
}

export function CalendarDayDetail({
  markers,
  date,
  onStartPlanned,
  onPlanDate,
  isStarting = false,
}: CalendarDayDetailProps) {
  const marker = getDayMarker(markers, date)
  const isPastDay = isPastCalendarDay(date)
  const canStartPlanned = canStartPlannedOccurrence(date, marker)
  const recordedWorkout = marker?.workouts[0]
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
              : isPastDay
                ? 'Aucune séance enregistrée pour ce jour'
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
              <li key={workout.id}>
                <Link
                  to="/app/workouts/$workoutId"
                  params={{ workoutId: workout.id }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-soft-primary/25 px-3 py-2.5 transition-colors active:bg-soft-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{workout.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(workout.started_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {marker?.planned.length ? (
        <section className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            {isPastDay ? 'Manqué' : 'Planifié'}
          </p>
          <ul className="space-y-2">
            {marker.planned.map((occurrence) => {
              const occurrenceContent = (
                <>
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{occurrence.title}</p>
                    {occurrence.workoutTemplateName ? (
                      <p className="text-xs text-muted-foreground">
                        {occurrence.workoutTemplateName}
                      </p>
                    ) : null}
                  </div>
                  {canStartPlanned && onStartPlanned ? (
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
                  ) : recordedWorkout ? (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <CalendarClock
                      className={cn(
                        'size-4 shrink-0',
                        isPastDay ? 'text-muted-foreground/50' : 'text-secondary',
                      )}
                    />
                  )}
                </>
              )

              const rowClassName = cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                isPastDay
                  ? 'border border-dashed border-muted-foreground/25 bg-muted/20'
                  : 'border border-dashed border-secondary/35 bg-soft-secondary/35',
                !canStartPlanned &&
                  recordedWorkout &&
                  'transition-colors active:bg-muted/30',
              )

              return (
                <li key={`${occurrence.sessionId}-${occurrence.date}`}>
                  {!canStartPlanned && recordedWorkout ? (
                    <Link
                      to="/app/workouts/$workoutId"
                      params={{ workoutId: recordedWorkout.id }}
                      className={rowClassName}
                    >
                      {occurrenceContent}
                    </Link>
                  ) : (
                    <div className={rowClassName}>{occurrenceContent}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {!hasContent ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
          <Dumbbell className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isPastDay ? 'Aucune séance enregistrée.' : 'Rien de prévu pour ce jour.'}
          </p>
        </div>
      ) : null}

      {isPastDay ? (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <History className="size-3.5" />
            Ajouter une activité passée
          </p>
          <SimplePastActivityForm date={date} />
        </div>
      ) : onPlanDate ? (
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

type WorkoutCalendarPanelProps = Omit<WorkoutCalendarProps, 'markers' | 'streak' | 'month' | 'onMonthChange'> & {
  onStartPlanned?: (occurrence: ScheduleOccurrence) => void
  onPlanDate?: (date: Date) => void
  isStarting?: boolean
}

export function WorkoutCalendarPanel({
  onStartPlanned,
  onPlanDate,
  isStarting,
  mode = 'compact',
  className,
  ...calendarProps
}: WorkoutCalendarPanelProps) {
  const [selected, setSelected] = useState<Date | undefined>(
    mode === 'full' ? new Date() : undefined,
  )
  const [visibleMonth, setVisibleMonth] = useState(
    () => startOfMonth(selected ?? new Date()),
  )
  const { markers, weeklyStreak, isLoading, error } = useCalendarData({
    visibleMonth,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du calendrier...</p>
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Erreur de chargement'}
      </p>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <WorkoutCalendar
        {...calendarProps}
        markers={markers}
        mode={mode}
        streak={weeklyStreak}
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
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
