import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CircleCheckBig, Sparkles, Trophy } from 'lucide-react'

import { WeightGoalJourneyMiniChart } from '@/components/goals/WeightGoalJourneyMiniChart'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import type { WeightEntry } from '@/lib/graphql/operations'
import {
  computeAverageWeeklyChangeGrams,
  computeJourneyDurationDays,
  markWeightGoalReachedCelebrationSeen,
} from '@/lib/goals/weight-goal-celebration'
import {
  formatWeightKg,
  progressKgSinceStart,
  shouldSuggestCalorieUpdate,
  suggestCalorieTarget,
  type WeightGoal,
} from '@/lib/goals/weight-goal'
import type { NutritionSettings } from '@/lib/nutrition/types'
import type { StoredUserMeasurements } from '@/lib/measurements/types'
import { cn } from '@/lib/utils'

type WeightGoalReachedCelebrationOverlayProps = {
  open: boolean
  goal: WeightGoal
  entries: WeightEntry[]
  nutritionSettings: NutritionSettings | null | undefined
  userMeasurements?: StoredUserMeasurements | null
  userId: string
  isPreview?: boolean
  onClose: () => void
  onSwitchToMaintain: (options: {
    applyCalorieSuggestion: boolean
    suggestedCalories: number | null
  }) => Promise<void>
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

const STEP_COUNT = 3

function formatDurationFromDays(days: number) {
  if (days < 14) {
    return `${days} jour${days > 1 ? 's' : ''}`
  }

  const weekCount = Math.max(1, Math.round(days / 7))
  return `${weekCount} semaine${weekCount > 1 ? 's' : ''}`
}

export function WeightGoalReachedCelebrationOverlay({
  open,
  goal,
  entries,
  nutritionSettings,
  userMeasurements,
  userId,
  isPreview = false,
  onClose,
  onSwitchToMaintain,
}: WeightGoalReachedCelebrationOverlayProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const progressKg = progressKgSinceStart(goal)
  const avgGramsPerWeek = computeAverageWeeklyChangeGrams(goal)
  const durationDays = computeJourneyDurationDays(goal)

  const calorieSuggestion = useMemo(() => {
    if (!nutritionSettings) {
      return null
    }

    return suggestCalorieTarget(
      nutritionSettings,
      'maintain',
      goal.current_weight_kg,
      userMeasurements,
    )
  }, [nutritionSettings, userMeasurements, goal.current_weight_kg])

  const showCalorieSuggestion =
    calorieSuggestion != null &&
    shouldSuggestCalorieUpdate(calorieSuggestion)

  const congratsCopy =
    goal.goal_type === 'lose'
      ? {
          title: 'Objectif atteint !',
          subtitle: 'Bravo pour votre perte de poids',
          description: `Vous avez atteint votre cible de ${formatWeightKg(goal.target_weight_kg)}. Félicitations pour cette étape !`,
        }
      : {
          title: 'Objectif atteint !',
          subtitle: 'Bravo pour votre prise de masse',
          description: `Vous avez atteint votre cible de ${formatWeightKg(goal.target_weight_kg)}. Félicitations pour cette étape !`,
        }

  const changeLabel =
    goal.goal_type === 'lose'
      ? `−${formatWeightKg(progressKg)}`
      : `+${formatWeightKg(progressKg)}`

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
    if (!isPreview) {
      markWeightGoalReachedCelebrationSeen(userId, goal)
    }
    onClose()
  }, [goal, isPreview, onClose, userId])

  const handleSwitchToMaintain = useCallback(async () => {
    setIsSaving(true)

    try {
      await onSwitchToMaintain({
        applyCalorieSuggestion: showCalorieSuggestion,
        suggestedCalories: calorieSuggestion?.suggestedCalories ?? null,
      })

      if (!isPreview) {
        markWeightGoalReachedCelebrationSeen(userId, goal)
      }
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [
    calorieSuggestion?.suggestedCalories,
    goal,
    isPreview,
    onClose,
    onSwitchToMaintain,
    showCalorieSuggestion,
    userId,
  ])

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex flex-col bg-[#ECFDF3]',
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={congratsCopy.title}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-[#86EFAC]/55 blur-3xl animate-workout-celebration-blob"
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
                  <span className="absolute inset-0 animate-workout-celebration-glow rounded-full bg-[#4ADE80]/30 blur-xl" />
                  <span className="absolute inset-3 animate-workout-celebration-ring rounded-full border border-[#4ADE80]/30 bg-white/40" />
                  <span className="absolute inset-0 animate-workout-celebration-orbit rounded-full border border-dashed border-[#86EFAC]/50" />
                  <div className="relative flex size-24 items-center justify-center rounded-full bg-white/75 shadow-[0_12px_40px_rgba(34,197,94,0.18)] backdrop-blur-sm animate-workout-celebration-float">
                    <Trophy className="size-11 text-emerald-600" aria-hidden />
                  </div>
                  <Sparkles
                    className="absolute -right-1 top-2 size-5 text-[#22C55E]/80 animate-workout-celebration-spark"
                    aria-hidden
                  />
                  <CircleCheckBig
                    className="absolute -left-2 bottom-3 size-5 text-emerald-500/80 animate-workout-celebration-spark-delay"
                    aria-hidden
                  />
                </div>

                <div className="animate-workout-celebration-pop-delay space-y-2">
                  <p className="font-display text-2xl font-black text-[#15803D]">
                    {congratsCopy.title}
                  </p>
                  <p className="font-display text-lg font-bold text-[#1F2937]">
                    {congratsCopy.subtitle}
                  </p>
                </div>

                <p className="mt-5 max-w-xs animate-workout-celebration-pop-delay text-sm leading-relaxed text-[#4B5563]">
                  {congratsCopy.description}
                </p>
              </div>
            </CarouselItem>

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5">
                <div className="text-center">
                  <p className="font-display text-xl font-black text-[#15803D]">
                    Votre parcours
                  </p>
                  <p className="mt-1 text-sm text-[#4B5563]">
                    Depuis le{' '}
                    {format(parseISO(goal.created_at), 'd MMMM yyyy', { locale: fr })}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200/60 bg-white/70 p-3 shadow-sm backdrop-blur-sm">
                  <WeightGoalJourneyMiniChart goal={goal} entries={entries} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-emerald-200/60 bg-white/70 px-2 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                      Total
                    </p>
                    <p className="mt-1 font-display text-sm font-black text-[#047857]">
                      {changeLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/60 bg-white/70 px-2 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                      Moyenne
                    </p>
                    <p className="mt-1 font-display text-sm font-black text-[#047857]">
                      {avgGramsPerWeek} g/sem.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/60 bg-white/70 px-2 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
                      Durée
                    </p>
                    <p className="mt-1 font-display text-sm font-black text-[#047857]">
                      {formatDurationFromDays(durationDays)}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>

            <CarouselItem className="flex basis-full flex-col justify-center pl-0">
              <div className="mx-auto w-full max-w-sm space-y-5 text-center">
                <div>
                  <p className="font-display text-xl font-black text-[#15803D]">
                    Passer en maintien ?
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                    Vous avez atteint votre objectif. Passez en mode conservation pour
                    stabiliser votre poids
                    {showCalorieSuggestion ? ' et ajuster vos calories' : ''}.
                  </p>
                </div>

                {calorieSuggestion && showCalorieSuggestion ? (
                  <div className="rounded-xl border border-emerald-200/60 bg-white/75 p-4 text-left text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#6B7280]">Calories actuelles</span>
                      <span className="font-semibold text-[#1F2937]">
                        {calorieSuggestion.currentCalories} kcal/j
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[#6B7280]">Suggestion maintien</span>
                      <span className="font-semibold text-[#047857]">
                        {calorieSuggestion.suggestedCalories} kcal/j
                        <span className="ml-1 text-xs font-normal text-[#6B7280]">
                          (
                          {calorieSuggestion.delta > 0
                            ? `+${calorieSuggestion.delta}`
                            : calorieSuggestion.delta}
                          )
                        </span>
                      </span>
                    </div>
                  </div>
                ) : calorieSuggestion ? (
                  <p className="text-sm text-[#6B7280]">
                    Vos calories actuelles ({calorieSuggestion.currentCalories} kcal/j)
                    conviennent déjà au maintien — aucun ajustement nécessaire.
                  </p>
                ) : (
                  <p className="text-sm text-[#6B7280]">
                    Complétez vos données nutrition pour obtenir une suggestion
                    calorique.
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isSaving}
                    onClick={() => void handleSwitchToMaintain()}
                  >
                    Passer en maintien
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#86EFAC]/70 bg-white/75 text-[#166534] hover:bg-white"
                    disabled={isSaving}
                    onClick={dismiss}
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>

          {!isLastStep ? (
            <>
              <CarouselPrevious className="left-2 border-emerald-200/70 bg-white/80 text-emerald-700 hover:bg-white" />
              <CarouselNext className="right-2 border-emerald-200/70 bg-white/80 text-emerald-700 hover:bg-white" />
            </>
          ) : null}
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
                    ? 'w-6 bg-emerald-600'
                    : 'w-2 bg-emerald-600/25',
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
              className="rounded-full border-[#86EFAC]/70 bg-white/75 px-10 text-[#166534] shadow-sm backdrop-blur-sm hover:bg-white"
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
