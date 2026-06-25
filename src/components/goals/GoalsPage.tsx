import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Minus, Plus, Target } from 'lucide-react'
import { useState } from 'react'

import { WeightGoalSetupWizard } from '@/components/goals/WeightGoalSetupWizard'
import { WeightMilestoneOverlay } from '@/components/goals/WeightMilestoneOverlay'
import { WeightProgressChart } from '@/components/goals/WeightProgressChart'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/design-system'
import { useAdjustWeightGoal } from '@/hooks/useAdjustWeightGoal'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useDeleteWeightGoal, useWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatProgressSinceStart,
  formatWeightKg,
  goalProgressPercent,
  hasNutritionBodyData,
  projectWeightGoalCompletion,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'

function formatWeeklyRate(weeklyRateKg: number) {
  if (weeklyRateKg < 0.1) {
    return `${Math.round(weeklyRateKg * 1000)} g/semaine`
  }
  return `${weeklyRateKg.toFixed(1).replace('.', ',')} kg/semaine`
}

export function GoalsPage() {
  const { data: goal, isLoading: goalLoading } = useWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: weightEntries = [], isLoading: entriesLoading } =
    useWeightEntries()
  const deleteGoal = useDeleteWeightGoal()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { adjustWeight, isPending: adjustPending, error: adjustError } =
    useAdjustWeightGoal({
      onMilestone: (count) => {
        setMilestoneCount(count)
        setMilestoneOpen(true)
      },
    })

  const projection =
    goal && nutritionSettings
      ? projectWeightGoalCompletion(goal, nutritionSettings)
      : null

  async function handleRemoveGoal() {
    setError(null)
    try {
      await deleteGoal.mutateAsync()
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Impossible de supprimer l’objectif.',
      )
    }
  }

  if (goalLoading) {
    return (
      <p className="text-sm text-muted-foreground">Chargement de l’objectif...</p>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Progression"
        title="Objectif poids"
        description="Suivez votre évolution et projetez votre date d’arrivée."
      />

      {!goal ? (
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">
              Aucun objectif défini
            </CardTitle>
            <CardDescription>
              Configurez d’abord votre nutrition, puis fixez un poids cible pour
              suivre votre progression.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                setWizardMode('create')
                setWizardOpen(true)
              }}
            >
              Définir un objectif
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display font-black">
                    {WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
                  </CardTitle>
                  <CardDescription>
                    Cible : {formatWeightKg(goal.target_weight_kg)}
                  </CardDescription>
                </div>
                <Target className="size-5 text-primary" aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Poids actuel</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={adjustPending}
                    onClick={() => void adjustWeight(goal, -1)}
                    aria-label="Diminuer le poids de 100 g"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <div className="text-center">
                    <p className="font-display text-3xl font-black">
                      {formatWeightKg(goal.current_weight_kg)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatProgressSinceStart(goal)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={adjustPending}
                    onClick={() => void adjustWeight(goal, 1)}
                    aria-label="Augmenter le poids de 100 g"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Ajustements par pas de 100 g
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progression vers la cible</span>
                  <span>{Math.round(goalProgressPercent(goal))} %</span>
                </div>
                <Progress value={goalProgressPercent(goal)} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setWizardMode('edit')
                    setWizardOpen(true)
                  }}
                >
                  Modifier l’objectif
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  disabled={deleteGoal.isPending}
                  onClick={() => void handleRemoveGoal()}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>

          {projection ? (
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display text-base font-black">
                  Projection
                </CardTitle>
                <CardDescription>
                  Estimation basée sur votre déficit calorique actuel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {projection.isReached ? (
                  <p className="font-medium text-primary">
                    Objectif atteint — bravo !
                  </p>
                ) : projection.weeklyRateKg > 0 && projection.projectedDate ? (
                  <>
                    <p>
                      Rythme estimé :{' '}
                      <span className="font-semibold">
                        {formatWeeklyRate(projection.weeklyRateKg)}
                      </span>
                    </p>
                    <p>
                      Arrivée estimée :{' '}
                      <span className="font-semibold text-primary">
                        {format(projection.projectedDate, 'd MMMM yyyy', {
                          locale: fr,
                        })}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Encore {formatWeightKg(projection.remainingKg)} à{' '}
                      {goal.goal_type === 'lose' ? 'perdre' : 'gagner'} avec un
                      déficit de {Math.abs(projection.dailyDeficitKcal)} kcal/j.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Ajustez votre objectif calorique pour activer une projection
                    (déficit actuel : {projection.dailyDeficitKcal} kcal/j).
                  </p>
                )}
              </CardContent>
            </Card>
          ) : !hasNutritionBodyData(nutritionSettings) ? (
            <Card className="rounded-2xl border-border">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Complétez vos données corporelles via « Modifier l’objectif » pour
                afficher une projection.
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display text-base font-black">
                Courbe de poids
              </CardTitle>
              <CardDescription>
                Historique de vos pesées et jalon projeté.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <WeightProgressChart
                  entries={weightEntries}
                  goal={goal}
                  projection={projection}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(error || adjustError) && (
        <FormMessage>{error ?? adjustError}</FormMessage>
      )}

      <WeightGoalSetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        mode={wizardMode}
      />

      <WeightMilestoneOverlay
        open={milestoneOpen}
        milestoneCount={milestoneCount ?? 0}
        goalLabel={
          goal ? WEIGHT_GOAL_TYPE_LABELS[goal.goal_type] : 'progression'
        }
        onClose={() => {
          setMilestoneOpen(false)
          setMilestoneCount(null)
        }}
      />
    </>
  )
}
