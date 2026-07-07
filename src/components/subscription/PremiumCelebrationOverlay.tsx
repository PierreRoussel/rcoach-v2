import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  Crown,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  DetailedStatsMockup,
  GoalProjectionMockup,
  NutritionHintMockup,
  OverloadAdviceMockup,
} from '@/components/subscription/PremiumFeatureMockups'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Pill } from '@/design-system'
import { markPremiumHomeCelebrationPending } from '@/lib/subscription/premium-home-celebration'
import { cn } from '@/lib/utils'

type PremiumCelebrationOverlayProps = {
  open: boolean
  onClose: () => void
}

type FeatureSlide = {
  id: string
  title: string
  description: string
  icon: typeof TrendingUp
  mockup: React.ReactNode
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 'overload',
    title: 'Charges & répétitions',
    description:
      'Recevez des suggestions d’ajustement pendant la séance et appliquez-les en un tap.',
    icon: TrendingUp,
    mockup: <OverloadAdviceMockup />,
  },
  {
    id: 'stats',
    title: 'Statistiques détaillées',
    description:
      'Graphiques, heatmap musculaire et historique complet pour analyser votre progression.',
    icon: BarChart3,
    mockup: <DetailedStatsMockup />,
  },
  {
    id: 'goal_projection',
    title: 'Prévision d’objectif',
    description:
      'Estimez votre date d’arrivée au poids cible selon votre déficit calorique actuel.',
    icon: Target,
    mockup: <GoalProjectionMockup />,
  },
  {
    id: 'nutrition_hint',
    title: 'Conseils nutrition',
    description:
      'Des recommandations personnalisées sur vos apports, directement dans le journal.',
    icon: Lightbulb,
    mockup: <NutritionHintMockup />,
  },
]

const STEP_COUNT = 2 + FEATURE_SLIDES.length

const BLOBS = [
  { size: 280, top: '-8%', left: '-12%', delay: 0, duration: 14 },
  { size: 220, top: '14%', left: '68%', delay: 1.1, duration: 16 },
  { size: 180, top: '58%', left: '-6%', delay: 0.6, duration: 13 },
]

export function PremiumCelebrationOverlay({ open, onClose }: PremiumCelebrationOverlayProps) {
  const navigate = useNavigate()
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const dismiss = useCallback(() => {
    onClose()
  }, [onClose])

  const finishAndGoHome = useCallback(() => {
    markPremiumHomeCelebrationPending()
    onClose()
    void navigate({ to: '/app' })
  }, [navigate, onClose])

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
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && selectedIndex === STEP_COUNT - 1) {
        finishAndGoHome()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finishAndGoHome, open, selectedIndex])

  if (!open) {
    return null
  }

  const isLastStep = selectedIndex === STEP_COUNT - 1

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex flex-col bg-[#FFFBEB]',
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue en Premium"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, index) => (
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
            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
                <div className="relative mb-8 flex size-36 items-center justify-center animate-workout-celebration-pop">
                  <span className="absolute inset-0 animate-workout-celebration-glow rounded-full bg-amber-400/30 blur-xl" />
                  <span className="absolute inset-3 animate-workout-celebration-ring rounded-full border border-amber-300/60 bg-white/40" />
                  <div className="relative flex size-24 items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/25 to-yellow-500/15 shadow-lg animate-workout-celebration-float">
                    <Crown className="size-10 text-amber-500" aria-hidden />
                  </div>
                  <Sparkles
                    className="absolute -right-1 top-2 size-5 animate-workout-celebration-spark text-amber-500 opacity-80"
                    aria-hidden
                  />
                </div>

                <Pill tone="solid-gold" className="gap-1">
                  <Sparkles className="size-3.5" aria-hidden />
                  Premium activé
                </Pill>

                <h2 className="mt-4 font-display text-2xl font-black text-[#2c2545]">
                  Bienvenue en Premium
                </h2>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#5c5278]">
                  Découvrez ce que vous venez de débloquer — balayez pour parcourir les
                  fonctionnalités.
                </p>
              </div>
            </CarouselItem>

            {FEATURE_SLIDES.map((slide) => {
              const Icon = slide.icon

              return (
                <CarouselItem
                  key={slide.id}
                  className="flex basis-full flex-col justify-center pl-0"
                >
                  <div className="mx-auto w-full max-w-sm space-y-5">
                    <div className="text-center">
                      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#f3e4eb] text-[#c45f84]">
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <h3 className="font-display text-xl font-black text-[#2c2545]">
                        {slide.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#5c5278]">
                        {slide.description}
                      </p>
                    </div>
                    {slide.mockup}
                  </div>
                </CarouselItem>
              )
            })}

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5 text-center">
                <Crown className="mx-auto size-10 text-amber-500" aria-hidden />
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-black text-[#2c2545]">
                    Tout est prêt
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5c5278]">
                    Profitez de votre essai gratuit. Vous pouvez gérer votre abonnement à tout
                    moment depuis votre profil.
                  </p>
                </div>
                <Button variant="pill" className="w-full" onClick={finishAndGoHome}>
                  C&apos;est parti
                </Button>
                <Button variant="ghost" className="w-full text-[#5c5278] hover:text-[#2c2545]" asChild>
                  <Link to="/app/profile/subscription" onClick={dismiss}>
                    Gérer mon abonnement
                  </Link>
                </Button>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        <div className="relative z-10 mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: STEP_COUNT }).map((_, index) => (
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
              className="rounded-full border-amber-300/60 bg-white px-10 text-[#2c2545] shadow-sm"
              onClick={() => api?.scrollNext()}
            >
              Suivant
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
