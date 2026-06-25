import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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
  const activeIndex = tabs.findIndex((tab) => tab.id === value)
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0
  const [mountedIndices, setMountedIndices] = useState(
    () => expandMountedIndices(new Set(), resolvedIndex, tabs.length),
  )

  const [carouselRef, api] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    duration: prefersReducedMotion ? 0 : 20,
    dragFree: false,
    watchDrag: true,
  })

  useEffect(() => {
    setMountedIndices((current) => {
      const next = expandMountedIndices(current, resolvedIndex, tabs.length)
      return setsAreEqual(current, next) ? current : next
    })
  }, [resolvedIndex, tabs.length])

  const syncUrlFromSwipe = useCallback(() => {
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

    api.on('settle', syncUrlFromSwipe)
    return () => {
      api.off('settle', syncUrlFromSwipe)
    }
  }, [api, syncUrlFromSwipe])

  useEffect(() => {
    if (!api || api.selectedScrollSnap() === resolvedIndex) {
      return
    }

    api.scrollTo(resolvedIndex, !prefersReducedMotion)
  }, [api, prefersReducedMotion, resolvedIndex])

  function handleTabChange(next: string) {
    if (next === value) {
      return
    }

    const tab = tabs.find((item) => item.id === next)
    if (!tab) {
      return
    }

    const index = tabs.findIndex((item) => item.id === tab.id)
    api?.scrollTo(index, !prefersReducedMotion)
    onChange(tab.id)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Tabs value={value} onValueChange={handleTabChange}>
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

      <div ref={carouselRef} className="overflow-hidden touch-pan-y">
        <div className="flex">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="min-w-0 shrink-0 grow-0 basis-full">
              {mountedIndices.has(index) ? tab.panel : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
