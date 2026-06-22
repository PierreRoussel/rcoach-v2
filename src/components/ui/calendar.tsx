import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants } from './button'


function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-full p-3', className)}
      classNames={{
        months: 'flex w-full flex-col gap-2 sm:flex-row',
        month: 'flex w-full flex-col gap-4',
        month_caption: 'relative flex w-full items-center justify-center pt-1',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex w-full',
        weekday:
          'flex-1 text-center text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: cn(
          'relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md',
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'mx-auto h-9 w-full max-w-9 p-0 font-normal aria-selected:opacity-100',
        ),
        range_start: 'day-range-start rounded-l-md',
        range_end: 'day-range-end rounded-r-md',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside:
          'day-outside text-muted-foreground aria-selected:text-muted-foreground',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
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
      }}
      {...props}
    />
  )
}

export { Calendar }
