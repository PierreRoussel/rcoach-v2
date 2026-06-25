import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { addDays, buildDateWindow, formatFrenchDateLabel } from '@/lib/nutrition/dates'
import { cn } from '@/lib/utils'

type DietDayCarouselProps = {
  date: string
  onDateChange: (date: string) => void
  renderDay: (date: string) => ReactNode
  className?: string
}

export function DietDayCarousel({
  date,
  onDateChange,
  renderDay,
  className,
}: DietDayCarouselProps) {
  const dates = buildDateWindow(date, 14)
  const activeIndex = dates.indexOf(date)

  const [carouselRef, api] = useEmblaCarousel({
    loop: false,
    align: 'center',
    startIndex: activeIndex >= 0 ? activeIndex : 14,
  })

  const syncDateFromCarousel = useCallback(() => {
    if (!api) {
      return
    }

    const index = api.selectedScrollSnap()
    const nextDate = dates[index]
    if (nextDate && nextDate !== date) {
      onDateChange(nextDate)
    }
  }, [api, date, dates, onDateChange])

  useEffect(() => {
    if (!api) {
      return
    }

    api.on('settle', syncDateFromCarousel)
    return () => {
      api.off('settle', syncDateFromCarousel)
    }
  }, [api, syncDateFromCarousel])

  useEffect(() => {
    if (!api) {
      return
    }

    const index = dates.indexOf(date)
    if (index >= 0 && api.selectedScrollSnap() !== index) {
      api.scrollTo(index, false)
    }
  }, [api, date, dates])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => onDateChange(addDays(date, -1))}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="text-center">
          <div className="font-display text-xl font-black text-foreground">
            {formatFrenchDateLabel(date)}
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => onDateChange(addDays(date, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div ref={carouselRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {dates.map((day) => (
            <div key={day} className="min-w-0 shrink-0 grow-0 basis-full">
              {renderDay(day)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
