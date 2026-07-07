import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Target } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { WaistAdjustTile } from '@/components/goals/WaistAdjustTile'
import { WaistProgressChart } from '@/components/goals/WaistProgressChart'
import { WeightMaintainDriftGauge } from '@/components/goals/WeightMaintainDriftGauge'
import { WeightAdjustTile } from '@/components/goals/WeightAdjustTile'
import { WeightGoalReachedCelebrationOverlay } from '@/components/goals/WeightGoalReachedCelebrationOverlay'
import { WeightGoalSetupCelebrationOverlay } from '@/components/goals/WeightGoalSetupCelebrationOverlay'
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
import {
  useNutritionSettings,
  useUpsertNutritionSettings,
} from '@/hooks/useNutritionSettings'
import { useWeightGoalSetupCelebration } from '@/hooks/useWeightGoalSetupCelebration'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useUpdateWeightGoal, useResolvedWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatWeightKg,
  goalProgressPercent,
  hasTdeeProfileData,
  isMaintainGoalInRange,
  isWeightGoalReached,
  projectWeightGoalCompletion,
  type WeightGoal,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import { useWaistEntries } from '@/hooks/useWaistEntries'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { cn } from '@/lib/utils'

function formatWeeklyRate(weeklyRateKg: number) {
  if (weeklyRateKg < 0.1) {
    return `${Math.round(weeklyRateKg * 1000)} g/semaine`
  }
  return `${weeklyRateKg.toFixed(1).replace('.', ',')} kg/semaine`
}

type GoalsPageProps = {
  previewWeightGoalReached?: boolean
  previewWeightGoalSetup?: 'lose' | 'gain' | null
}

export function GoalsPage({
  previewWeightGoalReached = false,
  previewWeightGoalSetup = null,
}: GoalsPageProps) {
  const { user } = useAuth()
  const { data: goal, isLoading: goalLoading } = useResolvedWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()
  const { data: weightEntries = [], isLoading: entriesLoading } =
    useWeightEntries()
  const { data: waistEntries = [], isLoading: waistEntriesLoading } = useWaistEntries()
  const updateGoal = useUpdateWeightGoal()
  const upsertNutrition = useUpsertNutritionSettings()
  const {
    onWizardCompleted,
    setupCelebrationPayload,
    setupCelebrationOpen,
    isSetupCelebrationPreview,
    nutritionSettings: setupCelebrationNutritionSettings,
    userMeasurements: setupCelebrationUserMeasurements,
    closeSetupCelebration,
  } = useWeightGoalSetupCelebration({
    previewGoalType: previewWeightGoalSetup,
  })

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null)
  const [celebrationOpen, setCelebrationOpen] = useState(false)
  const [celebrationGoal, setCelebrationGoal] = useState<WeightGoal | null>(null)

  const openCelebration = useCallback((nextGoal: WeightGoal) => {
    setCelebrationGoal(nextGoal)
    setCelebrationOpen(true)
  }, [])

  const { adjustWeight, isPending: adjustPending, error: adjustError } =
    useAdjustWeightGoal({
      onMilestone: (count) => {
        setMilestoneCount(count)
        setMilestoneOpen(true)
      },
      onGoalReached: openCelebration,
    })

  const isMaintainGoal = goal?.goal_type === 'maintain'
  const maintainInRange =
    isMaintainGoal && goal != null && isMaintainGoalInRange(goal)
  const goalReached =
    goal != null && !isMaintainGoal && isWeightGoalReached(goal)

  useEffect(() => {
    if (!previewWeightGoalReached || !goal) {
      return
    }

    openCelebration(goal)
  }, [previewWeightGoalReached, goal, openCelebration])

  const handleSwitchToMaintain = useCallback(
    async ({
      applyCalorieSuggestion,
      suggestedCalories,
    }: {
      applyCalorieSuggestion: boolean
      suggestedCalories: number | null
    }) => {
      if (!celebrationGoal) {
        return
      }

      await updateGoal.mutateAsync({
        goal_type: 'maintain',
        target_weight_kg: celebrationGoal.current_weight_kg,
      })

      if (applyCalorieSuggestion && suggestedCalories != null && nutritionSettings) {
        await upsertNutrition.mutateAsync({
          daily_calorie_target: suggestedCalories,
        })
      }
    },
    [celebrationGoal, nutritionSettings, updateGoal, upsertNutrition],
  )

  const projection =
    goal && nutritionSettings
      ? projectWeightGoalCompletion(goal, nutritionSettings, new Date(), userMeasurements)
      : null

  const showWaistChart = userMeasurements?.waist_cm != null

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
          <Card
            className={cn(
              'rounded-2xl border-border',
              maintainInRange &&
                'border-secondary/30 bg-gradient-to-br from-soft-secondary/60 via-card to-soft-secondary/25',
              goalReached &&
                'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/10',
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle
                    className={cn(
                      'font-display font-black',
                      maintainInRange && 'text-secondary-foreground',
                      goalReached && 'text-emerald-700 dark:text-emerald-300',
                    )}
                  >
                    {WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
                  </CardTitle>
                  {!isMaintainGoal ? (
                    <CardDescription
                      className={cn(
                        goalReached && 'text-emerald-700/80 dark:text-emerald-300/80',
                      )}
                    >
                      Cible : {formatWeightKg(goal.target_weight_kg)}
                      {goalReached ? ' — Objectif atteint !' : ''}
                    </CardDescription>
                  ) : null}
                </div>
                <Target
                  className={cn(
                    'size-5',
                    maintainInRange && 'text-secondary',
                    goalReached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : !maintainInRange && 'text-primary',
                  )}
                  aria-hidden
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <WeightAdjustTile
                goal={goal}
                disabled={adjustPending}
                onAdjust={(delta) => void adjustWeight(goal, delta)}
              />

              {isMaintainGoal ? (
                <WeightMaintainDriftGauge goal={goal} />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progression vers la cible</span>
                    <span>{Math.round(goalProgressPercent(goal))} %</span>
                  </div>
                  <Progress
                    value={goalProgressPercent(goal)}
                    className={cn(
                      'h-2',
                      goalReached &&
                        'bg-emerald-500/20 [&_[data-slot=progress-indicator]]:bg-emerald-500 dark:[&_[data-slot=progress-indicator]]:bg-emerald-400',
                    )}
                  />
                </div>
              )}

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
          ) : !hasTdeeProfileData(
              userMeasurements,
              nutritionSettings,
              goal.current_weight_kg,
              goal.goal_type,
            ) ? (
            <Card className="rounded-2xl border-border">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Complétez vos mensurations et votre profil nutrition via « Modifier
                l’objectif » pour afficher une projection.
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden rounded-2xl border-border">
            <CardHeader className="px-5">
              <CardTitle className="font-display text-base font-black">
                Courbe de poids
              </CardTitle>
              <CardDescription>
                Moyenne hebdomadaire de vos pesées et jalon projeté. Faites
                défiler pour parcourir la timeline (~2 mois visibles).
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {entriesLoading ? (
                <p className="px-5 text-sm text-muted-foreground">Chargement...</p>
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

      {showWaistChart && userMeasurements?.waist_cm != null ? (
        <div className="space-y-4">
          <WaistAdjustTile waistCm={userMeasurements.waist_cm} />

          <Card className="overflow-hidden rounded-2xl border-border">
            <CardHeader className="px-5">
              <CardTitle className="font-display text-base font-black">
                Tour de taille
              </CardTitle>
              <CardDescription>
                Moyenne hebdomadaire de vos mensurations. Faites défiler pour
                parcourir la timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              {waistEntriesLoading ? (
                <p className="px-5 text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <WaistProgressChart entries={waistEntries} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {adjustError && <FormMessage>{adjustError}</FormMessage>}

      <WeightGoalSetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        mode={wizardMode}
        onCompleted={onWizardCompleted}
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

      {celebrationGoal && user?.id ? (
        <WeightGoalReachedCelebrationOverlay
          open={celebrationOpen}
          goal={celebrationGoal}
          entries={weightEntries}
          nutritionSettings={nutritionSettings}
          userMeasurements={userMeasurements}
          userId={user.id}
          isPreview={previewWeightGoalReached}
          onClose={() => {
            setCelebrationOpen(false)
            setCelebrationGoal(null)
          }}
          onSwitchToMaintain={handleSwitchToMaintain}
        />
      ) : null}

      {setupCelebrationPayload ? (
        <WeightGoalSetupCelebrationOverlay
          open={setupCelebrationOpen}
          payload={setupCelebrationPayload}
          nutritionSettings={setupCelebrationNutritionSettings}
          userMeasurements={setupCelebrationUserMeasurements}
          isPreview={isSetupCelebrationPreview}
          onClose={closeSetupCelebration}
        />
      ) : null}
    </>
  )
}
