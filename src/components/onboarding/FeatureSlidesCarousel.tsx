import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ONBOARDING_FEATURE_SLIDES } from '@/lib/onboarding/slides'
import { cn } from '@/lib/utils'

type FeatureSlidesCarouselProps = {
  onComplete: () => void
  onSkip: () => void
}

export function FeatureSlidesCarousel({ onComplete, onSkip }: FeatureSlidesCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const slideCount = ONBOARDING_FEATURE_SLIDES.length
  const isLastSlide = selectedIndex === slideCount - 1

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

  const handlePrimaryAction = useCallback(() => {
    if (isLastSlide) {
      onComplete()
      return
    }

    api?.scrollNext()
  }, [api, isLastSlide, onComplete])

  return (
    <div className="flex min-h-svh flex-col bg-gradient-hero">
      <div className="flex items-center justify-end px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
          onClick={onSkip}
        >
          Passer
        </Button>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: false }}
        className="flex-1"
      >
        <CarouselContent className="ml-0 h-full">
          {ONBOARDING_FEATURE_SLIDES.map((slide) => {
            const Icon = slide.icon
            const imageFailed = imageErrors[slide.id]

            return (
              <CarouselItem key={slide.id} className="basis-full pl-0">
                <div className="flex h-full min-h-[calc(100svh-8rem)] flex-col px-4 pb-4">
                  <div className="flex flex-1 items-center justify-center py-2">
                    {imageFailed ? (
                      <div className="flex aspect-[9/16] w-full max-w-[280px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-soft-primary">
                          <Icon className="size-8 text-primary" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={slide.imageSrc}
                        alt={slide.title}
                        className="max-h-[58vh] w-full max-w-[320px] rounded-3xl object-contain shadow-lg"
                        onError={() =>
                          setImageErrors((current) => ({ ...current, [slide.id]: true }))
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-2 px-1 pb-2 text-center">
                    <h2 className="font-display text-2xl font-black text-foreground">
                      {slide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      <div className="space-y-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center gap-2">
          {ONBOARDING_FEATURE_SLIDES.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                'h-2 rounded-full transition-all',
                index === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-primary/25',
              )}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="pill"
          className="h-12 w-full rounded-full"
          onClick={handlePrimaryAction}
        >
          {isLastSlide ? 'Continuer' : 'Suivant'}
        </Button>
      </div>
    </div>
  )
}
