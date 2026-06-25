import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type CarouselApi = NonNullable<UseEmblaCarouselType[1]>

function resolveActiveIndex(api: CarouselApi, slideCount: number): number {
  if (slideCount <= 1) {
    return 0
  }

  const progress = api.scrollProgress()
  return Math.min(Math.round(progress * (slideCount - 1)), slideCount - 1)
}

export type SwipeableTabDefinition<T extends string> = {
  id: T
  label: string
  panel: ReactNode
}

type SwipeableTabPanelsProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  tabs: SwipeableTabDefinition<T>[]
  className?: string
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

export function SwipeableTabPanels<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: SwipeableTabPanelsProps<T>) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [visualTab, setVisualTab] = useState(value)
  const activeIndex = tabs.findIndex((tab) => tab.id === value)
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0

  const [carouselRef, api] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    duration: prefersReducedMotion ? 0 : 38,
    dragFree: false,
    watchDrag: true,
  })

  useEffect(() => {
    setVisualTab(value)
  }, [value])

  const syncVisualTabFromCarousel = useCallback(() => {
    if (!api) {
      return
    }

    const index = resolveActiveIndex(api, tabs.length)
    const tab = tabs[index]
    if (tab) {
      setVisualTab(tab.id)
    }
  }, [api, tabs])

  const syncUrlFromCarousel = useCallback(() => {
    if (!api) {
      return
    }

    const index = api.selectedScrollSnap()
    const tab = tabs[index]
    if (tab && tab.id !== value) {
      onChange(tab.id)
    }
  }, [api, onChange, tabs, value])

  useEffect(() => {
    if (!api) {
      return
    }

    syncVisualTabFromCarousel()
    api.on('scroll', syncVisualTabFromCarousel)
    api.on('select', syncUrlFromCarousel)
    return () => {
      api.off('scroll', syncVisualTabFromCarousel)
      api.off('select', syncUrlFromCarousel)
    }
  }, [api, syncUrlFromCarousel, syncVisualTabFromCarousel])

  useEffect(() => {
    if (!api || api.selectedScrollSnap() === resolvedIndex) {
      return
    }

    api.scrollTo(resolvedIndex, !prefersReducedMotion)
  }, [api, prefersReducedMotion, resolvedIndex])

  function handleTabChange(next: string) {
    if (next === visualTab) {
      return
    }

    const tab = tabs.find((item) => item.id === next)
    if (!tab) {
      return
    }

    setVisualTab(tab.id)
    onChange(tab.id)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Tabs value={visualTab} onValueChange={handleTabChange}>
        <TabsList className="grid h-auto w-full grid-cols-3 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="py-2 text-xs sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div ref={carouselRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {tabs.map((tab) => (
            <div key={tab.id} className="min-w-0 shrink-0 grow-0 basis-full">
              {tab.panel}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
