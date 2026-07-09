import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateIn } from '@/design-system'
import { addDays, buildDateWindow, formatFrenchDateLabel } from '@/lib/nutrition/dates'
import { cn } from '@/lib/utils'

type CarouselApi = NonNullable<UseEmblaCarouselType[1]>

function expandMountedIndices(indices: Set<number>, centerIndex: number, slideCount: number) {
  const next = new Set(indices)
  const start = Math.max(0, centerIndex - 1)
  const end = Math.min(slideCount - 1, centerIndex + 1)

  for (let index = start; index <= end; index += 1) {
    next.add(index)
  }

  return next
}

function setsAreEqual(left: Set<number>, right: Set<number>) {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

function DietDaySlidePlaceholder() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        Chargement...
      </CardContent>
    </Card>
  )
}

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
  const dates = useMemo(() => buildDateWindow(date, 14), [date])
  const datesRef = useRef(dates)
  datesRef.current = dates

  const onDateChangeRef = useRef(onDateChange)
  onDateChangeRef.current = onDateChange

  const activeIndex = dates.indexOf(date)
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 14
  const [displayDate, setDisplayDate] = useState(date)
  const [mountedIndices, setMountedIndices] = useState(
    () => expandMountedIndices(new Set(), resolvedIndex, dates.length),
  )

  const [carouselRef, api] = useEmblaCarousel({
    loop: false,
    align: 'center',
    startIndex: resolvedIndex,
    duration: 20,
    dragFree: false,
    watchDrag: true,
  })

  useEffect(() => {
    setDisplayDate(date)
  }, [date])

  useEffect(() => {
    setMountedIndices((current) => {
      const next = expandMountedIndices(current, resolvedIndex, dates.length)
      return setsAreEqual(current, next) ? current : next
    })
  }, [resolvedIndex, dates.length])

  const syncDisplayDateFromScroll = useCallback(() => {
    if (!api) {
      return
    }

    const currentDates = datesRef.current
    const index = resolveActiveIndex(api, currentDates.length)
    const nextDate = currentDates[index]
    if (nextDate) {
      setDisplayDate((current) => (current === nextDate ? current : nextDate))
    }

    setMountedIndices((current) => {
      const next = expandMountedIndices(current, index, currentDates.length)
      return setsAreEqual(current, next) ? current : next
    })
  }, [api])

  const syncUrlFromCarousel = useCallback(() => {
    if (!api) {
      return
    }

    const currentDates = datesRef.current
    const index = api.selectedScrollSnap()
    const nextDate = currentDates[index]
    if (nextDate && nextDate !== date) {
      onDateChangeRef.current(nextDate)
    }
  }, [api, date])

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
  }, [api, date, dates.length])

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
        {dates.map((day, index) => (
          <div key={day} className="min-w-0 shrink-0 grow-0 basis-full">
            {mountedIndices.has(index) ? renderDay(day) : <DietDaySlidePlaceholder />}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn('diet-day-carousel space-y-1', className)}>
      {animateEntrance ? <AnimateIn delay={80}>{dateHeader}</AnimateIn> : dateHeader}
      {animateEntrance ? <AnimateIn delay={160}>{daySlides}</AnimateIn> : daySlides}
    </div>
  )
}
