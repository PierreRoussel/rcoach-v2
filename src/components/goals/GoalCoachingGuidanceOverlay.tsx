import { Apple, Flame, Scale, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { WeightAdjustTile } from '@/components/goals/WeightAdjustTile'
import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { trackEvent } from '@/lib/analytics/track-event'
import {
  adjustWeightKg,
  formatWeightKg,
  type WeightGoal,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import type {
  CalorieAdjustmentSuggestion,
  DietAdherence14d,
} from '@/lib/goals/goal-coaching-lifecycle'

type GoalCoachingGuidanceOverlayProps = {
  open: boolean
  goal: WeightGoal
  dietAdherence: DietAdherence14d
  calorieSuggestion: CalorieAdjustmentSuggestion | null
  isSavingWeight: boolean
  isSavingCalories: boolean
  onClose: () => void
  onConfirmWeight: (weightKg: number) => Promise<void>
  onApplyCalories: (calories: number) => Promise<void>
}

export function GoalCoachingGuidanceOverlay({
  open,
  goal,
  dietAdherence,
  calorieSuggestion,
  isSavingWeight,
  isSavingCalories,
  onClose,
  onConfirmWeight,
  onApplyCalories,
}: GoalCoachingGuidanceOverlayProps) {
  const [draftWeight, setDraftWeight] = useState(goal.current_weight_kg)
  const [weightConfirmed, setWeightConfirmed] = useState(false)

  useEffect(() => {
    if (open) {
      setDraftWeight(goal.current_weight_kg)
      setWeightConfirmed(false)
    }
  }, [goal.current_weight_kg, open])

  const previewGoal = useMemo(
    () => ({ ...goal, current_weight_kg: draftWeight }),
    [draftWeight, goal],
  )

  const goalLabel = WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]

  const slides = useMemo(() => {
    const weightSlide = (
      <div key="weight" className="mx-auto w-full max-w-sm space-y-4">
        <div className="text-center">
          <Scale className="mx-auto mb-3 size-10 text-violet-500" aria-hidden />
          <h3 className="font-display text-xl font-black text-foreground">
            Confirmez votre poids actuel
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Un poids à jour nous aide à analyser correctement votre stagnation.
          </p>
        </div>
        <WeightAdjustTile
          goal={previewGoal}
          disabled={isSavingWeight || weightConfirmed}
          onAdjust={(deltaSteps) => {
            setDraftWeight((current) => adjustWeightKg(current, deltaSteps))
          }}
        />
        {!weightConfirmed ? (
          <Button
            type="button"
            variant="pill"
            className="w-full"
            disabled={isSavingWeight}
            onClick={async () => {
              await onConfirmWeight(draftWeight)
              setWeightConfirmed(true)
            }}
          >
            {draftWeight === goal.current_weight_kg
              ? 'Confirmer mon poids'
              : `Enregistrer ${formatWeightKg(draftWeight)}`}
          </Button>
        ) : (
          <p className="text-center text-sm text-emerald-700">
            Poids enregistré · {formatWeightKg(draftWeight)}
          </p>
        )}
      </div>
    )

    const dietSlide = (
      <div key="diet" className="mx-auto w-full max-w-sm space-y-4 text-center">
        <Apple className="mx-auto size-10 text-violet-500" aria-hidden />
        <h3 className="font-display text-xl font-black text-foreground">
          Analyse de votre diète
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sur les 14 derniers jours, vous avez enregistré{' '}
          <strong>{dietAdherence.loggedDays} jours</strong> de calories.
        </p>
        <Pill tone={dietAdherence.adherent ? 'solid-accent' : 'solid-gold'}>
          {dietAdherence.adherent
            ? 'Suivi régulier'
            : 'Suivi insuffisant'}
        </Pill>
      </div>
    )

    const branchSlides = dietAdherence.adherent
      ? [
          <div
            key="completeness"
            className="mx-auto w-full max-w-sm space-y-4 text-center"
          >
            <TrendingUp className="mx-auto size-10 text-violet-500" aria-hidden />
            <h3 className="font-display text-xl font-black text-foreground">
              Journal assez complet ?
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pour aller plus loin, pensez à noter vos protéines, vos repas et
              vos boissons. Un journal détaillé aide à affiner les recommandations.
            </p>
          </div>,
        ]
      : [
          <div
            key="challenge"
            className="mx-auto w-full max-w-sm space-y-4 text-center"
          >
            <Flame className="mx-auto size-10 text-violet-500" aria-hidden />
            <h3 className="font-display text-xl font-black text-foreground">
              Défi 1 semaine
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Visez au moins 10 jours de suivi calorique sur 14. Commencez par
              enregistrer chaque repas cette semaine.
            </p>
          </div>,
        ]

    const kcalSlide =
      calorieSuggestion && Math.abs(calorieSuggestion.delta) >= 50
        ? [
            <div key="kcal" className="mx-auto w-full max-w-sm space-y-4">
              <div className="text-center">
                <TrendingUp
                  className="mx-auto mb-3 size-10 text-violet-500"
                  aria-hidden
                />
                <h3 className="font-display text-xl font-black text-foreground">
                  Ajustement calorique
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Suggestion pour votre objectif de {goalLabel.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-xl border border-violet-200/60 bg-white/80 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Actuellement</span>
                  <span className="font-semibold">
                    {calorieSuggestion.currentCalories} kcal/j
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Suggestion</span>
                  <span className="font-semibold text-primary">
                    {calorieSuggestion.suggestedCalories} kcal/j (
                    {calorieSuggestion.delta > 0 ? '+' : ''}
                    {calorieSuggestion.delta})
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {calorieSuggestion.rationale}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="pill"
                  className="w-full"
                  disabled={isSavingCalories}
                  onClick={async () => {
                    await onApplyCalories(calorieSuggestion.suggestedCalories)
                    trackEvent('goal_coaching_kcal_applied', {
                      delta: calorieSuggestion.delta,
                    })
                    onClose()
                  }}
                >
                  Appliquer la suggestion
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={isSavingCalories}
                  onClick={onClose}
                >
                  Garder mes calories
                </Button>
              </div>
            </div>,
          ]
        : []

    return [weightSlide, dietSlide, ...branchSlides, ...kcalSlide]
  }, [
    calorieSuggestion,
    dietAdherence,
    draftWeight,
    goal.current_weight_kg,
    goalLabel,
    isSavingCalories,
    isSavingWeight,
    onApplyCalories,
    onClose,
    onConfirmWeight,
    previewGoal,
    weightConfirmed,
  ])

  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel="Guidage coaching objectif poids"
      backgroundClassName="bg-gradient-to-b from-[#F5F3FF] to-[#EDE9FE]"
      slides={slides}
      onDismissLastStep={onClose}
      footer={
        slides.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={onClose}
          >
            Fermer
          </Button>
        ) : null
      }
    />
  )
}
