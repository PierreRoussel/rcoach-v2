import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

const DEFAULT_BLOBS = [
  { size: 280, top: '-8%', left: '-12%', delay: 0, duration: 14 },
  { size: 220, top: '14%', left: '68%', delay: 1.1, duration: 16 },
  { size: 180, top: '58%', left: '-6%', delay: 0.6, duration: 13 },
]

type FullscreenCarouselOverlayProps = {
  open: boolean
  ariaLabel: string
  backgroundClassName?: string
  slides: ReactNode[]
  footer?: ReactNode
  onDismissLastStep?: () => void
}

export function FullscreenCarouselOverlay({
  open,
  ariaLabel,
  backgroundClassName = 'bg-[#FFFBEB]',
  slides,
  footer,
  onDismissLastStep,
}: FullscreenCarouselOverlayProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const stepCount = slides.length
  const isLastStep = selectedIndex === stepCount - 1

  useEffect(() => {
    if (!api) {
      return
    }

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap())
    }

    onSelect()
    api.on('select', onSelect)

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!open) {
      setSelectedIndex(0)
      api?.scrollTo(0)
    }
  }, [api, open])

  useEffect(() => {
    if (!open || !onDismissLastStep) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isLastStep) {
        onDismissLastStep()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isLastStep, onDismissLastStep, open])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex flex-col',
        backgroundClassName,
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {DEFAULT_BLOBS.map((blob, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-amber-400/20 blur-3xl animate-workout-celebration-blob"
            style={{
              width: blob.size,
              height: blob.size,
              top: blob.top,
              left: blob.left,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
            aria-hidden
          />
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Carousel
          setApi={setApi}
          opts={{ align: 'start', loop: false }}
          className="flex min-h-0 w-full flex-1 flex-col justify-center"
        >
          <CarouselContent className="ml-0 h-full items-stretch">
            {slides.map((slide, index) => (
              <CarouselItem
                key={index}
                className="flex basis-full flex-col justify-center pl-0"
              >
                {slide}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="relative z-10 mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: stepCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === selectedIndex
                    ? 'w-6 bg-amber-500'
                    : 'w-2 bg-amber-500/25',
                )}
                aria-label={`Étape ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>

          {!isLastStep ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-amber-300/60 bg-white px-10 text-foreground shadow-sm"
              onClick={() => api?.scrollNext()}
            >
              Suivant
            </Button>
          ) : null}

          {footer}
        </div>
      </div>
    </div>
  )
}
