import { format } from 'date-fns'
import * as React from 'react'
import type { DayButtonProps, DayProps } from 'react-day-picker'

import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import {
  getMarkerKind,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

function dayButtonAppearance(
  modifiers: DayButtonProps['modifiers'],
  className?: string,
  planningLayout = false,
) {
  return cn(
    'relative flex shrink-0 flex-col items-center justify-center p-0 font-display text-sm font-bold tabular-nums transition-all duration-200 hover:bg-muted/50 active:scale-[0.98]',
    planningLayout
      ? 'h-11 w-10 gap-0.5 rounded-lg'
      : 'aspect-square h-10 w-10 rounded-full hover:scale-[1.03] hover:bg-muted/60',
    modifiers.selected &&
      'scale-105 bg-primary font-black text-primary-foreground shadow-lg shadow-primary/35 hover:bg-primary hover:text-primary-foreground',
    !modifiers.selected &&
      modifiers.today &&
      'text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-card',
    !modifiers.selected &&
      modifiers.missed &&
      'text-muted-foreground/50',
    modifiers.outside && 'text-muted-foreground/25 hover:bg-transparent',
    className,
  )
}

function nutritionNumberStyle(
  nutrition: NutritionDayAggregate | undefined,
  showNutrition: boolean,
  modifiers: DayButtonProps['modifiers'],
) {
  if (
    !showNutrition ||
    modifiers.selected ||
    modifiers.outside ||
    !nutrition?.hasLogs
  ) {
    return null
  }

  if (nutrition.status === 'on_target') {
    return 'bg-soft-secondary text-secondary-foreground ring-1 ring-secondary/25'
  }

  if (nutrition.status === 'over_target') {
    return 'bg-[color-mix(in_srgb,var(--destructive)_16%,var(--card))] text-destructive ring-1 ring-destructive/20'
  }

  return null
}

function SportDayMarker({ modifiers }: { modifiers: DayButtonProps['modifiers'] }) {
  if (modifiers.selected) {
    return null
  }

  const isMixed =
    Boolean(modifiers.mixed) ||
    (Boolean(modifiers.done) && Boolean(modifiers.planned))

  if (isMixed) {
    return (
      <span
        aria-hidden
        className="h-1 w-4 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary"
      />
    )
  }

  if (modifiers.done) {
    return (
      <span
        aria-hidden
        className="h-1 w-4 shrink-0 rounded-full bg-primary"
      />
    )
  }

  if (modifiers.planned) {
    return (
      <span
        aria-hidden
        className="h-1 w-4 shrink-0 rounded-full bg-secondary"
      />
    )
  }

  if (modifiers.missed) {
    return (
      <span
        aria-hidden
        className="h-1 w-4 shrink-0 rounded-full bg-muted-foreground/35"
      />
    )
  }

  return null
}

export function PlanningCalendarDay({
  className,
  children,
  day: _day,
  modifiers: _modifiers,
  ...props
}: DayProps) {
  return (
    <div
      {...props}
      className={cn('flex h-11 min-w-0 items-center justify-center p-0', className)}
    >
      {children}
    </div>
  )
}

export function PlanningCalendarDayButton({
  className,
  children,
  day,
  modifiers,
  markers,
  nutritionDays,
  showNutrition = false,
  compact = false,
  ...props
}: DayButtonProps & {
  markers: CalendarMarkers
  nutritionDays?: Map<string, NutritionDayAggregate>
  showNutrition?: boolean
  compact?: boolean
}) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const dateKey = format(day.date, 'yyyy-MM-dd')
  const marker = markers.get(dateKey)
  const sportKind = getMarkerKind(marker)
  const nutrition = nutritionDays?.get(dateKey)
  const nutritionStyle = nutritionNumberStyle(nutrition, showNutrition, modifiers)
  const planningLayout = !compact
  const showSportMarker =
    !modifiers.selected &&
    Boolean(
      modifiers.done ||
        modifiers.planned ||
        modifiers.missed ||
        modifiers.mixed,
    )

  React.useEffect(() => {
    if (!modifiers.focused || !ref.current) {
      return
    }

    if (ref.current === document.activeElement) {
      return
    }

    ref.current.focus({ preventScroll: true })
  }, [modifiers.focused])

  const sportLabel =
    sportKind === 'done'
      ? 'Séance réalisée'
      : sportKind === 'planned'
        ? 'Séance planifiée'
        : sportKind === 'missed'
          ? 'Séance manquée'
          : sportKind === 'mixed'
            ? 'Séance partiellement réalisée'
            : undefined

  const nutritionLabel =
    nutrition?.hasLogs && showNutrition
      ? nutrition.status === 'on_target'
        ? 'Objectif calorique respecté'
        : 'Objectif calorique dépassé'
      : undefined

  const ariaLabel = [sportLabel, nutritionLabel].filter(Boolean).join(' — ')

  return (
    <button
      ref={ref}
      type="button"
      className={dayButtonAppearance(modifiers, className, planningLayout)}
      aria-label={ariaLabel || undefined}
      {...props}
    >
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full leading-none',
          nutritionStyle,
          modifiers.missed &&
            !modifiers.selected &&
            !nutritionStyle &&
            'line-through decoration-muted-foreground/40',
        )}
      >
        {children}
      </span>
      {showSportMarker ? <SportDayMarker modifiers={modifiers} /> : null}
    </button>
  )
}

export function createPlanningCalendarComponents(options: {
  markers: CalendarMarkers
  nutritionDays?: Map<string, NutritionDayAggregate>
  showNutrition?: boolean
  compact?: boolean
}) {
  const usePlanningLayout = !options.compact

  return {
    ...(usePlanningLayout
      ? {
          Day: PlanningCalendarDay,
        }
      : {}),
    DayButton: (props: DayButtonProps) => (
      <PlanningCalendarDayButton {...props} {...options} />
    ),
  }
}
