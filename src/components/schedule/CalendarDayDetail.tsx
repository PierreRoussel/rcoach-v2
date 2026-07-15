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
  UtensilsCrossed,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useCreateSimpleWorkout } from '@/hooks/useWorkouts'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import {
  formatDayMarkerTitle,
  getDayMarker,
  WorkoutCalendar,
  type WorkoutCalendarProps,
} from '@/components/schedule/WorkoutCalendar'
import { Pill } from '@/design-system'
import { MEAL_ICONS, MEAL_ICON_TINT } from '@/lib/nutrition/meal-visuals'
import { toDateKey } from '@/lib/nutrition/dates'
import { isNutritionConfigured } from '@/lib/nutrition/onboarding'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import { MEAL_LABELS, MEAL_TYPES } from '@/lib/nutrition/types'
import {
  canStartPlannedOccurrence,
  isPastCalendarDay,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import {
  findFulfillingWorkout,
  occurrenceIsFulfilled,
} from '@/lib/schedule/occurrence-fulfillment'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { cn } from '@/lib/utils'

type CalendarDayDetailProps = {
  markers: CalendarMarkers
  date: Date
  nutritionDay?: NutritionDayAggregate
  dailyTarget?: number
  showNutrition?: boolean
  embedded?: boolean
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

export function PlanningDayConnector({ date }: { date: Date }) {
  return (
    <div
      className="relative border-t border-primary/20 bg-gradient-to-b from-soft-primary/25 to-soft-primary/5 px-4 py-2.5"
      aria-hidden
    >
      <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="size-2.5 rotate-45 border border-primary/25 bg-card shadow-sm" />
      </div>
      <div className="flex items-center justify-center gap-2">
        <CalendarDays className="size-3.5 shrink-0 text-soft-primary-fg" />
        <p className="font-display text-sm font-bold capitalize text-foreground">
          {format(date, 'EEEE d MMMM', { locale: fr })}
        </p>
      </div>
    </div>
  )
}

export function CalendarDayDetail({
  markers,
  date,
  nutritionDay,
  dailyTarget,
  showNutrition = false,
  embedded = false,
  onStartPlanned,
  onPlanDate,
  isStarting = false,
}: CalendarDayDetailProps) {
  const marker = getDayMarker(markers, date)
  const isPastDay = isPastCalendarDay(date)
  const hasSportContent = Boolean(marker?.workouts.length || marker?.planned.length)
  const hasNutritionContent = Boolean(showNutrition && nutritionDay?.hasLogs)
  const hasContent = hasSportContent || hasNutritionContent
  const dateKey = toDateKey(date)

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-top-2 space-y-4 duration-300',
        embedded
          ? 'bg-muted/10 px-4 pb-4 pt-3'
          : 'rounded-xl border border-border/60 bg-muted/10 p-4',
      )}
    >
      {!embedded ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-display text-lg font-black capitalize leading-tight text-foreground">
              {formatDayMarkerTitle(marker, date)}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasContent
                ? 'Détail de la journée sélectionnée'
                : isPastDay
                  ? 'Aucune activité enregistrée pour ce jour'
                  : 'Rien de prévu pour ce jour'}
            </p>
          </div>
          <Pill tone="purple" className="shrink-0 py-1">
            <CalendarDays className="size-3" />
            Jour
          </Pill>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {hasContent
            ? 'Détail de la journée sélectionnée'
            : isPastDay
              ? 'Aucune activité enregistrée pour ce jour'
              : 'Rien de prévu pour ce jour'}
        </p>
      )}

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
              const isFulfilled = occurrenceIsFulfilled(marker.workouts, occurrence)
              const fulfillingWorkout = findFulfillingWorkout(marker.workouts, occurrence)
              const canStartThis = canStartPlannedOccurrence(date, marker, occurrence)
              const isMissed = isPastDay && !isFulfilled

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
                  {canStartThis && onStartPlanned ? (
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
                  ) : fulfillingWorkout ? (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <CalendarClock
                      className={cn(
                        'size-4 shrink-0',
                        isMissed ? 'text-muted-foreground/50' : 'text-secondary',
                      )}
                    />
                  )}
                </>
              )

              const rowClassName = cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                isMissed
                  ? 'border border-dashed border-muted-foreground/25 bg-muted/20'
                  : isFulfilled
                    ? 'border border-primary/15 bg-soft-primary/25'
                    : 'border border-dashed border-secondary/35 bg-soft-secondary/35',
                fulfillingWorkout && 'transition-colors active:bg-muted/30',
              )

              return (
                <li key={`${occurrence.sessionId}-${occurrence.date}`}>
                  {fulfillingWorkout ? (
                    <Link
                      to="/app/workouts/$workoutId"
                      params={{ workoutId: fulfillingWorkout.id }}
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

      {showNutrition ? (
        <section className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Nutrition
          </p>
          {hasNutritionContent && dailyTarget ? (
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5">
              <p className="font-display font-bold text-foreground">
                {Math.round(nutritionDay!.calories)} / {dailyTarget} kcal
              </p>
              <p className="text-xs text-muted-foreground">
                {nutritionDay!.status === 'on_target'
                  ? 'Objectif calorique respecté'
                  : 'Objectif calorique dépassé'}
              </p>
              {nutritionDay!.loggedMeals && nutritionDay!.loggedMeals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {MEAL_TYPES.filter((mealType) =>
                    nutritionDay!.loggedMeals?.includes(mealType),
                  ).map((mealType) => {
                    const Icon = MEAL_ICONS[mealType]
                    return (
                      <Pill
                        key={mealType}
                        tone="default"
                        className={cn('gap-1 py-1', MEAL_ICON_TINT[mealType])}
                      >
                        <Icon className="size-3" />
                        {MEAL_LABELS[mealType]}
                      </Pill>
                    )
                  })}
                </div>
              ) : null}
              <Button
                asChild
                variant="soft"
                size="sm"
                className="w-full rounded-full"
              >
                <Link to="/app/diet" search={{ date: dateKey }}>
                  <UtensilsCrossed className="size-4" />
                  Voir le journal alimentaire
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-4 text-center">
              <UtensilsCrossed className="size-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucun aliment enregistré ce jour-là.
              </p>
              <Button asChild variant="soft" size="sm" className="rounded-full">
                <Link to="/app/diet" search={{ date: dateKey }}>
                  Ouvrir la diète
                </Link>
              </Button>
            </div>
          )}
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
  hideCalendarStreak?: boolean
  belowCalendar?: React.ReactNode
  initialSelectedDate?: Date
}

export function WorkoutCalendarPanel({
  onStartPlanned,
  onPlanDate,
  isStarting,
  hideCalendarStreak = false,
  belowCalendar,
  initialSelectedDate,
  mode = 'compact',
  className,
  ...calendarProps
}: WorkoutCalendarPanelProps) {
  const [selected, setSelected] = useState<Date | undefined>(initialSelectedDate)
  const [visibleMonth, setVisibleMonth] = useState(
    () => startOfMonth(selected ?? new Date()),
  )
  const { data: nutritionSettings } = useNutritionSettings()
  const nutritionConfigured = isNutritionConfigured(nutritionSettings)
  const dailyTarget = nutritionSettings?.daily_calorie_target
  const { markers, nutritionDays, weeklyStreak, isLoading, error } = useCalendarData({
    visibleMonth,
    nutritionDailyTarget: nutritionConfigured ? dailyTarget : null,
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

  const selectedNutritionDay = selected
    ? nutritionDays.get(toDateKey(selected))
    : undefined

  return (
    <div className={cn('w-full space-y-4', className)}>
      <WorkoutCalendar
        {...calendarProps}
        markers={markers}
        nutritionDays={nutritionDays}
        showNutrition={nutritionConfigured}
        mode={mode}
        streak={hideCalendarStreak ? undefined : weeklyStreak}
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        selected={selected}
        onSelect={setSelected}
      />
      {selected && mode === 'full' ? (
        <>
          <PlanningDayConnector date={selected} />
          <CalendarDayDetail
            markers={markers}
            date={selected}
            nutritionDay={selectedNutritionDay}
            dailyTarget={dailyTarget}
            showNutrition={nutritionConfigured}
            embedded
            onStartPlanned={onStartPlanned}
            onPlanDate={onPlanDate}
            isStarting={isStarting}
          />
        </>
      ) : selected ? (
        <CalendarDayDetail
          markers={markers}
          date={selected}
          nutritionDay={selectedNutritionDay}
          dailyTarget={dailyTarget}
          showNutrition={nutritionConfigured}
          onStartPlanned={onStartPlanned}
          onPlanDate={onPlanDate}
          isStarting={isStarting}
        />
      ) : null}
      {belowCalendar ? <div>{belowCalendar}</div> : null}
    </div>
  )
}
