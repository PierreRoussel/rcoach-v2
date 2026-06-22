import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DayPicker,
  type DayButtonProps,
  type DayProps,
  type MonthGridProps,
  type WeekdayProps,
  type WeekProps,
} from 'react-day-picker'

import { cn } from '@/lib/utils'

const dayButtonBase =
  'relative flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-full p-0 font-display text-sm font-bold tabular-nums transition-all duration-200 hover:scale-[1.03] hover:bg-muted/60 active:scale-[0.98]'

function dayButtonAppearance(
  modifiers: DayButtonProps['modifiers'],
  className?: string,
) {
  return cn(
    dayButtonBase,
    modifiers.selected &&
      'scale-105 bg-primary font-black text-primary-foreground shadow-lg shadow-primary/35 hover:bg-primary hover:text-primary-foreground',
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

function DayMarker({ modifiers }: { modifiers: DayButtonProps['modifiers'] }) {
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
        className="pointer-events-none absolute bottom-0 left-1/2 z-[2] h-1.5 w-3 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary"
      />
    )
  }

  if (modifiers.done) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[2] size-2 -translate-x-1/2 rounded-full bg-primary shadow-sm shadow-primary/40"
      />
    )
  }

  if (modifiers.planned) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[2] size-2 -translate-x-1/2 rounded-full bg-secondary shadow-sm shadow-secondary/30"
      />
    )
  }

  if (modifiers.missed) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[2] size-2 -translate-x-1/2 rounded-full bg-muted-foreground/50"
      />
    )
  }

  return null
}

function CalendarWeekday({ className, children, ...props }: WeekdayProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex h-8 items-center justify-center text-[0.65rem] font-bold uppercase text-muted-foreground/80',
        className,
      )}
    >
      {children}
    </div>
  )
}

function CalendarDay({
  className,
  children,
  day: _day,
  modifiers: _modifiers,
  ...props
}: DayProps) {
  return (
    <div
      {...props}
      className={cn('flex h-11 items-center justify-center p-0', className)}
    >
      {children}
    </div>
  )
}

function CalendarDayButton({
  className,
  children,
  day: _day,
  modifiers,
  ...props
}: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      className={dayButtonAppearance(modifiers, className)}
      {...props}
    >
      <span className="relative z-[1]">{children}</span>
      <DayMarker modifiers={modifiers} />
    </button>
  )
}

function Calendar({
  className,
  classNames,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={props.showOutsideDays ?? true}
      className={cn('w-full', className)}
      classNames={{
        months: 'flex w-full flex-col',
        month: 'flex w-full flex-col',
        month_caption: 'hidden',
        caption_label: 'hidden',
        nav: 'hidden',
        button_previous: 'hidden',
        button_next: 'hidden',
        month_grid: 'w-full',
        weekdays: 'grid w-full grid-cols-7',
        weekday: '',
        weeks: 'w-full',
        week: 'mt-1 grid w-full grid-cols-7',
        day: cn(
          'group/day',
          props.mode === 'range'
            ? 'first:aria-selected:rounded-l-full last:aria-selected:rounded-r-full'
            : 'aria-selected:rounded-full',
        ),
        day_button: '',
        range_start: 'day-range-start',
        range_end: 'day-range-end',
        selected: '',
        today: '',
        outside: '',
        disabled: 'opacity-40',
        range_middle: 'aria-selected:bg-soft-primary/50 aria-selected:text-primary',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        MonthCaption: () => null,
        MonthGrid: ({ className: gridClassName, children, ...gridProps }: MonthGridProps) => (
          <div className={gridClassName} {...gridProps}>
            {children}
          </div>
        ),
        Weekdays: ({ className, children, ...weekdaysProps }) => (
          <div className={cn('grid w-full grid-cols-7', className)} {...weekdaysProps}>
            {children}
          </div>
        ),
        Weekday: CalendarWeekday,
        Weeks: ({ className, children, ...weeksProps }) => (
          <div className={className} {...weeksProps}>
            {children}
          </div>
        ),
        Week: ({ className, children, week: _week, ...weekProps }: WeekProps) => (
          <div className={cn('mt-1 grid w-full grid-cols-7', className)} {...weekProps}>
            {children}
          </div>
        ),
        Day: CalendarDay,
        DayButton: CalendarDayButton,
        Chevron: ({ className, orientation, ...iconProps }) => {
          const iconClassName = cn('size-4', className)

          if (orientation === 'left') {
            return <ChevronLeft className={iconClassName} {...iconProps} />
          }

          if (orientation === 'right') {
            return <ChevronRight className={iconClassName} {...iconProps} />
          }

          return <ChevronDown className={iconClassName} {...iconProps} />
        },
        ...components,
      }}
      {...props}
      hideNavigation={props.hideNavigation ?? true}
    />
  )
}

export { Calendar }
