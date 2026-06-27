import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ONBOARDING_FEATURE_SLIDES } from '@/lib/onboarding/slides'
import { OnboardingSlideImage } from '@/components/onboarding/OnboardingSlideImage'
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
  const activeSlide = ONBOARDING_FEATURE_SLIDES[selectedIndex]

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
    <div className="relative flex h-svh max-h-svh flex-col overflow-hidden">
      <div
        key={activeSlide.id}
        className="onboarding-bg-enter pointer-events-none absolute inset-0"
        style={{ background: activeSlide.background }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-end px-4 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
        className="flex min-h-0 w-full flex-1 flex-col justify-center"
      >
        <CarouselContent className="ml-0 h-full items-stretch">
          {ONBOARDING_FEATURE_SLIDES.map((slide, index) => {
            const isActive = index === selectedIndex

            return (
              <CarouselItem
                key={slide.id}
                className="flex h-full basis-full flex-col justify-center pl-0"
              >
                <OnboardingSlideImage
                    slideId={slide.id}
                    imageSrc={slide.imageSrc}
                    alt={slide.title}
                    imageTilt={slide.imageTilt}
                    isActive={isActive}
                    selectedIndex={selectedIndex}
                    fallbackIcon={slide.icon}
                    imageFailed={Boolean(imageErrors[slide.id])}
                    onError={() =>
                      setImageErrors((current) => ({ ...current, [slide.id]: true }))
                    }
                  />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      <div className="shrink-0 space-y-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-0">
        <div key={selectedIndex} className="onboarding-text-enter space-y-1.5 px-1 text-center">
          <h2 className="mx-auto flex max-w-full items-center justify-center gap-2 font-display text-xl font-black leading-tight text-foreground sm:text-2xl">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm',
                activeSlide.iconBadgeClass,
              )}
              aria-hidden
            >
              <activeSlide.icon className="size-[18px] fill-current" strokeWidth={1.75} />
            </span>
            <span className="text-balance">{activeSlide.title}</span>
          </h2>
          <p className="text-sm leading-snug text-muted-foreground">{activeSlide.subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {ONBOARDING_FEATURE_SLIDES.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
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
    </div>
  )
}
