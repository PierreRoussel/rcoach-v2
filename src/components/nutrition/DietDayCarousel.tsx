import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { AnimateIn } from '@/design-system'
import { addDays, buildDateWindow, formatFrenchDateLabel } from '@/lib/nutrition/dates'
import { cn } from '@/lib/utils'

type CarouselApi = NonNullable<UseEmblaCarouselType[1]>

function resolveActiveIndex(api: CarouselApi, slideCount: number) {
  if (slideCount <= 1) {
    return 0
  }

  const progress = api.scrollProgress()
  return Math.min(Math.round(progress * (slideCount - 1)), slideCount - 1)
}

type DietDayCarouselProps = {
  date: string
  onDateChange: (date: string) => void
  renderDay: (date: string) => ReactNode
  className?: string
  animateEntrance?: boolean
}

export function DietDayCarousel({
  date,
  onDateChange,
  renderDay,
  className,
  animateEntrance = false,
}: DietDayCarouselProps) {
  const dates = buildDateWindow(date, 14)
  const activeIndex = dates.indexOf(date)
  const [displayDate, setDisplayDate] = useState(date)

  const [carouselRef, api] = useEmblaCarousel({
    loop: false,
    align: 'center',
    startIndex: activeIndex >= 0 ? activeIndex : 14,
    duration: 20,
    dragFree: false,
    watchDrag: true,
  })

  useEffect(() => {
    setDisplayDate(date)
  }, [date])

  const syncDisplayDateFromScroll = useCallback(() => {
    if (!api) {
      return
    }

    const index = resolveActiveIndex(api, dates.length)
    const nextDate = dates[index]
    if (nextDate) {
      setDisplayDate(nextDate)
    }
  }, [api, dates])

  const syncUrlFromCarousel = useCallback(() => {
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

    syncDisplayDateFromScroll()
    api.on('scroll', syncDisplayDateFromScroll)
    api.on('select', syncUrlFromCarousel)
    return () => {
      api.off('scroll', syncDisplayDateFromScroll)
      api.off('select', syncUrlFromCarousel)
    }
  }, [api, syncDisplayDateFromScroll, syncUrlFromCarousel])

  useEffect(() => {
    if (!api) {
      return
    }

    const index = dates.indexOf(date)
    if (index >= 0 && api.selectedScrollSnap() !== index) {
      api.scrollTo(index, false)
    }
  }, [api, date, dates])

  function handleChevronChange(nextDate: string) {
    setDisplayDate(nextDate)
    onDateChange(nextDate)
  }

  const dateHeader = (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => handleChevronChange(addDays(displayDate, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="text-center">
        <div className="font-display text-xl font-black text-foreground">
          {formatFrenchDateLabel(displayDate)}
        </div>
        <div className="text-xs text-muted-foreground">{displayDate}</div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => handleChevronChange(addDays(displayDate, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )

  const daySlides = (
    <div ref={carouselRef} className="overflow-hidden">
      <div className="flex touch-pan-y">
        {dates.map((day) => (
          <div key={day} className="min-w-0 shrink-0 grow-0 basis-full">
            {renderDay(day)}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-3', className)}>
      {animateEntrance ? <AnimateIn delay={80}>{dateHeader}</AnimateIn> : dateHeader}
      {animateEntrance ? <AnimateIn delay={160}>{daySlides}</AnimateIn> : daySlides}
    </div>
  )
}
