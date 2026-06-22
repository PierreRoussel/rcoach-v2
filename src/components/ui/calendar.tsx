import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayProps, type WeekdayProps } from 'react-day-picker'

import { cn } from '@/lib/utils'

const dayButtonBase =
  'relative flex h-10 w-full items-center justify-center rounded-full p-0 font-display text-sm font-bold tabular-nums transition-all duration-200 hover:scale-[1.03] hover:bg-muted/60 active:scale-[0.98]'

function CalendarWeekday({ className, children, ...props }: WeekdayProps) {
  return (
    <th {...props} className={cn(className)}>
      <span className="flex h-8 w-full items-center justify-center">{children}</span>
    </th>
  )
}

function CalendarDay({ className, children, day: _day, modifiers: _modifiers, ...props }: DayProps) {
  return (
    <td {...props} className={cn(className)}>
      {children}
    </td>
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
        month_grid:
          'w-full table-fixed border-collapse [&_th]:p-0 [&_td]:p-0 [&_th]:text-center [&_td]:text-center',
        weekdays: '',
        weekday:
          'p-0 align-middle text-[0.65rem] font-bold uppercase text-muted-foreground/80',
        weeks: '',
        week: '',
        day: cn(
          'group/day h-11 p-0 text-center align-middle',
          props.mode === 'range'
            ? 'first:aria-selected:rounded-l-full last:aria-selected:rounded-r-full'
            : 'aria-selected:rounded-full',
        ),
        day_button: cn(
          dayButtonBase,
          'text-foreground',
          'group-aria-selected/day:scale-105 group-aria-selected/day:shadow-md',
          'group-aria-selected/day:hover:scale-105 group-aria-selected/day:hover:bg-transparent',
        ),
        range_start: 'day-range-start',
        range_end: 'day-range-end',
        selected:
          'rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30',
        today: 'rounded-full',
        outside: 'day-outside opacity-100',
        disabled: 'opacity-40',
        range_middle: 'aria-selected:bg-soft-primary/50 aria-selected:text-primary',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        MonthCaption: () => null,
        Weekday: CalendarWeekday,
        Day: CalendarDay,
        MonthGrid: ({ className: gridClassName, children, ...gridProps }) => (
          <table className={gridClassName} {...gridProps}>
            <colgroup>
              {Array.from({ length: 7 }).map((_, index) => (
                <col key={index} style={{ width: `${100 / 7}%` }} />
              ))}
            </colgroup>
            {children}
          </table>
        ),
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
