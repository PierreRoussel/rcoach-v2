import { format } from 'date-fns'
import * as React from 'react'
import type { DayButtonProps, DayProps } from 'react-day-picker'

import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import {
  getMarkerKind,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

const NUMBER_SLOT =
  'flex size-7 shrink-0 items-center justify-center rounded-full leading-none ring-1 ring-transparent'
const SPORT_SLOT = 'flex h-1 w-4 shrink-0 items-center justify-center'

function dayButtonAppearance(
  modifiers: DayButtonProps['modifiers'],
  className?: string,
) {
  return cn(
    'relative grid h-11 w-10 shrink-0 grid-rows-[1.75rem_0.25rem] items-center justify-items-center gap-0.5 bg-transparent p-0 font-display text-sm font-bold tabular-nums transition-colors duration-200 hover:bg-muted/40 active:scale-[0.98]',
    modifiers.outside && 'text-muted-foreground/25 hover:bg-transparent',
    !modifiers.selected && modifiers.missed && 'text-muted-foreground/50',
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
    return 'bg-soft-secondary text-secondary-foreground ring-secondary/25'
  }

  if (nutrition.status === 'over_target') {
    return 'bg-[color-mix(in_srgb,var(--destructive)_16%,var(--card))] text-destructive ring-destructive/20'
  }

  return null
}

function SportDayMarker({ modifiers }: { modifiers: DayButtonProps['modifiers'] }) {
  const isMixed =
    Boolean(modifiers.mixed) ||
    (Boolean(modifiers.done) && Boolean(modifiers.planned))

  if (isMixed) {
    return (
      <span className="h-1 w-4 overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary" />
    )
  }

  if (modifiers.done) {
    return <span className="h-1 w-4 rounded-full bg-primary" />
  }

  if (modifiers.planned) {
    return <span className="h-1 w-4 rounded-full bg-secondary" />
  }

  if (modifiers.missed) {
    return <span className="h-1 w-4 rounded-full bg-muted-foreground/35" />
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
      className={cn('flex h-11 min-w-0 items-end justify-center pb-0.5 p-0', className)}
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
  compact: _compact = false,
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
      className={dayButtonAppearance(modifiers, className)}
      aria-label={ariaLabel || undefined}
      aria-current={modifiers.selected ? 'date' : undefined}
      {...props}
    >
      <span
        className={cn(
          NUMBER_SLOT,
          modifiers.selected &&
            'bg-primary font-black text-primary-foreground shadow-md shadow-primary/30 ring-primary/40',
          !modifiers.selected && nutritionStyle,
          !modifiers.selected &&
            modifiers.today &&
            'ring-2 ring-primary/45',
          modifiers.missed &&
            !modifiers.selected &&
            !nutritionStyle &&
            'line-through decoration-muted-foreground/40',
        )}
      >
        {children}
      </span>
      <span className={SPORT_SLOT} aria-hidden>
        {showSportMarker ? <SportDayMarker modifiers={modifiers} /> : null}
      </span>
    </button>
  )
}

export function createPlanningCalendarComponents(options: {
  markers: CalendarMarkers
  nutritionDays?: Map<string, NutritionDayAggregate>
  showNutrition?: boolean
  compact?: boolean
}) {
  return {
    Day: PlanningCalendarDay,
    DayButton: (props: DayButtonProps) => (
      <PlanningCalendarDayButton {...props} {...options} />
    ),
  }
}
