import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from '@tanstack/react-router'
import { Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react'

import { WeightGoalProjectionMiniChart } from '@/components/goals/WeightGoalProjectionMiniChart'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  buildWeightGoalProjectionChartData,
  getWeightGoalSetupCelebrationCopy,
  resolveSetupCelebrationProjection,
  type WeightGoalSetupCelebrationPayload,
} from '@/lib/goals/weight-goal-setup-celebration'
import { formatWeightKg } from '@/lib/goals/weight-goal'
import type { NutritionSettings } from '@/lib/nutrition/types'
import type { StoredUserMeasurements } from '@/lib/measurements/types'
import { cn } from '@/lib/utils'

type WeightGoalSetupCelebrationOverlayProps = {
  open: boolean
  payload: WeightGoalSetupCelebrationPayload
  nutritionSettings: NutritionSettings | null | undefined
  userMeasurements?: StoredUserMeasurements | null
  isPreview?: boolean
  onClose: () => void
}

type BlobConfig = {
  size: number
  top: string
  left: string
  delay: number
  duration: number
}

const BLOBS: BlobConfig[] = [
  { size: 280, top: '-8%', left: '-12%', delay: 0, duration: 14 },
  { size: 220, top: '14%', left: '68%', delay: 1.1, duration: 16 },
  { size: 180, top: '58%', left: '-6%', delay: 0.6, duration: 13 },
  { size: 150, top: '68%', left: '58%', delay: 1.8, duration: 15 },
]

const STEP_COUNT = 4

function formatWeeklyRate(weeklyRateKg: number) {
  if (weeklyRateKg < 0.1) {
    return `${Math.round(weeklyRateKg * 1000)} g/semaine`
  }

  return `${weeklyRateKg.toFixed(1).replace('.', ',')} kg/semaine`
}

export function WeightGoalSetupCelebrationOverlay({
  open,
  payload,
  nutritionSettings,
  userMeasurements,
  isPreview = false,
  onClose,
}: WeightGoalSetupCelebrationOverlayProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const goal = payload.goal
  const goalType = goal.goal_type === 'gain' ? 'gain' : 'lose'
  const copy = getWeightGoalSetupCelebrationCopy(goalType)

  const { nutritionProjection, chartProjection } = useMemo(
    () =>
      resolveSetupCelebrationProjection(
        { ...payload, userMeasurements: userMeasurements ?? payload.userMeasurements },
        nutritionSettings,
      ),
    [nutritionSettings, payload, userMeasurements],
  )

  const chartPoints = useMemo(
    () => buildWeightGoalProjectionChartData(goal, chartProjection),
    [chartProjection, goal],
  )

  const dailyEnergyDelta = Math.abs(nutritionProjection?.dailyDeficitKcal ?? 0)
  const hasProjectedDate =
    nutritionProjection?.projectedDate != null && !nutritionProjection.isReached

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

  const dismiss = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && selectedIndex === STEP_COUNT - 1) {
        dismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dismiss, open, selectedIndex])

  if (!open) {
    return null
  }

  const isLastStep = selectedIndex === STEP_COUNT - 1
  const TrendIcon = goalType === 'lose' ? TrendingDown : TrendingUp
  const primaryButtonClass =
    goalType === 'lose'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-amber-600 hover:bg-amber-700'
  const outlineButtonClass =
    goalType === 'lose'
      ? 'border-blue-200/70 bg-white/75 text-blue-800 hover:bg-white'
      : 'border-amber-200/70 bg-white/75 text-amber-900 hover:bg-white'
  const dotActiveClass = goalType === 'lose' ? 'bg-blue-600' : 'bg-amber-600'
  const dotInactiveClass =
    goalType === 'lose' ? 'bg-blue-600/25' : 'bg-amber-600/25'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex flex-col',
        copy.backgroundClass,
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, index) => (
          <span
            key={index}
            className={cn(
              'absolute rounded-full blur-3xl animate-workout-celebration-blob',
              copy.blobClass,
            )}
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
                  <span
                    className={cn(
                      'absolute inset-0 animate-workout-celebration-glow rounded-full blur-xl',
                      goalType === 'lose' ? 'bg-blue-400/30' : 'bg-amber-400/30',
                    )}
                  />
                  <span
                    className={cn(
                      'absolute inset-3 animate-workout-celebration-ring rounded-full border bg-white/40',
                      copy.accentBorderClass,
                    )}
                  />
                  <span
                    className={cn(
                      'absolute inset-0 animate-workout-celebration-orbit rounded-full border border-dashed',
                      copy.accentBorderClass,
                    )}
                  />
                  <div className="relative flex size-24 items-center justify-center rounded-full bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm animate-workout-celebration-float">
                    <TrendIcon className={cn('size-10', copy.accentTextClass)} aria-hidden />
                    <Target
                      className={cn('absolute -bottom-1 -right-1 size-5', copy.accentTextClass)}
                      aria-hidden
                    />
                  </div>
                  <Sparkles
                    className={cn(
                      'absolute -right-1 top-2 size-5 animate-workout-celebration-spark',
                      copy.accentTextClass,
                      'opacity-80',
                    )}
                    aria-hidden
                  />
                </div>

                <div className="animate-workout-celebration-pop-delay space-y-2">
                  <p className={cn('font-display text-2xl font-black', copy.accentTextClass)}>
                    {copy.title}
                  </p>
                  <p className="font-display text-lg font-bold text-[#1F2937]">
                    {copy.subtitle}
                  </p>
                </div>

                <p className="mt-5 max-w-xs animate-workout-celebration-pop-delay text-sm leading-relaxed text-[#4B5563]">
                  {copy.description}
                </p>

                <div
                  className={cn(
                    'mt-6 rounded-2xl border bg-white/75 px-5 py-4 shadow-sm backdrop-blur-sm',
                    copy.accentBorderClass,
                  )}
                >
                  <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                    Votre objectif
                  </p>
                  <p className="mt-2 font-display text-xl font-black text-[#1F2937]">
                    {formatWeightKg(goal.current_weight_kg)}
                    <span className="mx-2 text-base font-semibold text-[#9CA3AF]">→</span>
                    {formatWeightKg(goal.target_weight_kg)}
                  </p>
                </div>
              </div>
            </CarouselItem>

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5">
                <div className="text-center">
                  <p className={cn('font-display text-xl font-black', copy.accentTextClass)}>
                    {copy.trajectoryTitle}
                  </p>
                  {hasProjectedDate ? (
                    <p className="mt-1 text-sm text-[#4B5563]">
                      Objectif visé le{' '}
                      {format(nutritionProjection!.projectedDate!, 'd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  ) : chartProjection ? (
                    <p className="mt-1 text-sm text-[#4B5563]">
                      Rythme indicatif : {formatWeeklyRate(chartProjection.weeklyRateKg)}
                      {chartProjection.isEstimate ? ' (estimation)' : ''}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[#4B5563]">
                      Ajustez vos calories pour estimer une date.
                    </p>
                  )}
                </div>

                <div
                  className={cn(
                    'rounded-2xl border bg-white/70 p-3 shadow-sm backdrop-blur-sm',
                    copy.accentBorderClass,
                  )}
                >
                  <WeightGoalProjectionMiniChart
                    goal={goal}
                    points={chartPoints}
                    goalType={goalType}
                  />
                </div>
              </div>
            </CarouselItem>

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5 text-center">
                <div>
                  <p className={cn('font-display text-xl font-black', copy.accentTextClass)}>
                    {copy.nutritionTitle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                    Vos repères caloriques pour atteindre{' '}
                    {formatWeightKg(goal.target_weight_kg)}.
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-xl border bg-white/75 p-4 text-left text-sm',
                    copy.accentBorderClass,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6B7280]">TDEE estimé</span>
                    <span className="font-semibold text-[#1F2937]">
                      {Math.round(payload.tdee)} kcal/j
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[#6B7280]">Objectif journalier</span>
                    <span className="font-semibold text-[#1F2937]">
                      {payload.dailyCalorieTarget} kcal/j
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[#6B7280]">{copy.energyLabel}</span>
                    <span className={cn('font-semibold', copy.accentTextClass)}>
                      {dailyEnergyDelta > 0 ? `${dailyEnergyDelta} kcal` : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[#6B7280]">Poids visé</span>
                    <span className="font-semibold text-[#1F2937]">
                      {formatWeightKg(goal.target_weight_kg)}
                    </span>
                  </div>
                </div>
              </div>
            </CarouselItem>

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5 text-center">
                <div>
                  <p className={cn('font-display text-xl font-black', copy.accentTextClass)}>
                    {copy.actionTitle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                    Trois habitudes simples pour tenir la trajectoire.
                  </p>
                </div>

                <ul className="space-y-3 text-left text-sm text-[#4B5563]">
                  {copy.rules.map((rule) => (
                    <li
                      key={rule}
                      className={cn(
                        'rounded-xl border bg-white/75 px-4 py-3',
                        copy.accentBorderClass,
                      )}
                    >
                      {rule}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    className={cn('rounded-full', primaryButtonClass)}
                    asChild
                  >
                    <Link to="/app/planning" onClick={dismiss}>
                      Planifier mes séances
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('rounded-full', outlineButtonClass)}
                    asChild
                  >
                    <Link to="/app/premium" onClick={dismiss}>
                      Avoir plus de conseils
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    className={cn('rounded-full', primaryButtonClass)}
                    onClick={dismiss}
                  >
                    C&apos;est parti
                  </Button>
                </div>
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
                    ? cn('w-6', dotActiveClass)
                    : cn('w-2', dotInactiveClass),
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
              className={cn('rounded-full px-10 shadow-sm backdrop-blur-sm', outlineButtonClass)}
              onClick={() => api?.scrollNext()}
            >
              Suivant
            </Button>
          ) : null}
        </div>

        {isPreview ? (
          <p className="mt-2 text-center text-xs text-[#6B7280]">Aperçu développeur</p>
        ) : null}
      </div>
    </div>
  )
}
