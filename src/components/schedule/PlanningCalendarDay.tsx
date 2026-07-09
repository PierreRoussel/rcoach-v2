import { format } from 'date-fns'
import { Check, Dumbbell, X } from 'lucide-react'
import * as React from 'react'
import type { DayButtonProps, DayProps } from 'react-day-picker'

import { MEAL_ICONS, MEAL_ICON_TINT } from '@/lib/nutrition/meal-visuals'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import { MEAL_TYPES } from '@/lib/nutrition/types'
import {
  getMarkerKind,
  type CalendarMarkers,
  type DayMarkerKind,
} from '@/lib/schedule/calendar-markers'
import { cn } from '@/lib/utils'

const dayButtonBase =
  'relative flex w-full shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl p-0.5 font-display text-sm font-bold tabular-nums transition-all duration-200 hover:bg-muted/60 active:scale-[0.98]'

function dayButtonAppearance(
  modifiers: DayButtonProps['modifiers'],
  className?: string,
  showNutrition = false,
) {
  return cn(
    dayButtonBase,
    showNutrition ? 'min-h-[3.75rem]' : 'aspect-square h-10 w-10 rounded-full',
    modifiers.selected &&
      'scale-[1.02] bg-primary font-black text-primary-foreground shadow-lg shadow-primary/35 hover:bg-primary hover:text-primary-foreground',
    !modifiers.selected &&
      modifiers.today &&
      'text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-card',
    !modifiers.selected &&
      modifiers.missed &&
      'text-muted-foreground/40 line-through decoration-muted-foreground/35',
    modifiers.outside && 'text-muted-foreground/25 hover:bg-transparent',
    className,
  )
}

const sportBarClass: Record<DayMarkerKind, string> = {
  done: 'bg-primary shadow-sm shadow-primary/30',
  planned: 'border border-dashed border-secondary bg-secondary/35',
  missed: 'bg-muted-foreground/35',
  mixed: 'bg-gradient-to-r from-primary to-secondary',
}

function SportDayIndicator({
  kind,
  sessionCount,
  compact,
}: {
  kind: DayMarkerKind
  sessionCount: number
  compact: boolean
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center gap-0.5 px-0.5',
        compact ? 'h-2' : 'h-3',
      )}
      aria-hidden
    >
      <Dumbbell
        className={cn(
          'shrink-0',
          compact ? 'size-1.5' : 'size-2',
          kind === 'missed' ? 'text-muted-foreground/45' : 'text-primary/75',
        )}
      />
      <span
        className={cn(
          'rounded-full',
          compact ? 'h-0.5 min-w-[0.75rem] flex-1' : 'h-1 min-w-[0.875rem] flex-1',
          sportBarClass[kind],
        )}
      />
      {sessionCount > 1 ? (
        <span className="text-[0.5rem] font-bold leading-none text-muted-foreground">
          {sessionCount}
        </span>
      ) : null}
    </div>
  )
}

function MealBadgesRow({
  nutrition,
  compact,
}: {
  nutrition: NutritionDayAggregate
  compact: boolean
}) {
  if (!nutrition.hasLogs) {
    return null
  }

  const loggedMeals = MEAL_TYPES.filter((mealType) =>
    nutrition.loggedMeals?.includes(mealType),
  )

  if (loggedMeals.length === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-0.5" aria-hidden>
      {loggedMeals.map((mealType) => {
        const Icon = MEAL_ICONS[mealType]
        return (
          <span
            key={mealType}
            className={cn(
              'flex items-center justify-center rounded-full',
              MEAL_ICON_TINT[mealType],
              compact ? 'size-2.5' : 'size-3',
            )}
          >
            <Icon className={compact ? 'size-1.5' : 'size-2'} />
          </span>
        )
      })}
      {nutrition.status === 'on_target' ? (
        <Check className={cn('text-emerald-500', compact ? 'size-1.5' : 'size-2')} />
      ) : nutrition.status === 'over_target' ? (
        <X className={cn('text-destructive', compact ? 'size-1.5' : 'size-2')} />
      ) : null}
    </div>
  )
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
      className={cn('flex min-h-[3.75rem] items-stretch justify-center p-0', className)}
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
  const hasNutritionBadges = Boolean(
    showNutrition && nutrition?.hasLogs && (nutrition.loggedMeals?.length ?? 0) > 0,
  )
  const useTallLayout = showNutrition && (hasNutritionBadges || compact === false)
  const sessionCount = (marker?.workouts.length ?? 0) + (marker?.planned.length ?? 0)

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
      className={dayButtonAppearance(modifiers, className, useTallLayout)}
      aria-label={ariaLabel || undefined}
      {...props}
    >
      {sportKind && !modifiers.selected ? (
        <SportDayIndicator
          kind={sportKind}
          sessionCount={sessionCount}
          compact={compact && !useTallLayout}
        />
      ) : (
        <span className={cn(useTallLayout ? 'h-3' : 'h-0')} aria-hidden />
      )}
      <span className="relative z-[1] leading-none">{children}</span>
      {hasNutritionBadges && !modifiers.selected ? (
        <MealBadgesRow nutrition={nutrition!} compact={compact} />
      ) : null}
    </button>
  )
}

export function createPlanningCalendarComponents(options: {
  markers: CalendarMarkers
  nutritionDays?: Map<string, NutritionDayAggregate>
  showNutrition?: boolean
  compact?: boolean
}) {
  const useTallDayCell =
    options.showNutrition && (options.compact === false || options.nutritionDays)

  return {
    ...(useTallDayCell
      ? {
          Day: PlanningCalendarDay,
        }
      : {}),
    DayButton: (props: DayButtonProps) => (
      <PlanningCalendarDayButton {...props} {...options} />
    ),
  }
}
