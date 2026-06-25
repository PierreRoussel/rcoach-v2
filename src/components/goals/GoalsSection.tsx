import { Link } from '@tanstack/react-router'
import { Minus, Plus, Target } from 'lucide-react'
import { useState } from 'react'

import { WeightGoalSetupWizard } from '@/components/goals/WeightGoalSetupWizard'
import { WeightMilestoneOverlay } from '@/components/goals/WeightMilestoneOverlay'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { useAdjustWeightGoal } from '@/hooks/useAdjustWeightGoal'
import { useDeleteWeightGoal, useWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatProgressSinceStart,
  formatWeightKg,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'

export function GoalsSection() {
  const { data: goal, isLoading: goalLoading } = useWeightGoal()
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
    return <p className="text-sm text-muted-foreground">Chargement des objectifs...</p>
  }

  return (
    <>
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display font-black">Objectifs</CardTitle>
              <CardDescription>
                Suivez votre poids et progressez vers votre cible.
              </CardDescription>
            </div>
            <Target className="size-5 text-primary" aria-hidden />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {goal ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  Cible : {formatWeightKg(goal.target_weight_kg)}
                </span>
              </div>

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

              <div className="flex flex-wrap gap-2">
                <Button variant="soft" size="sm" className="rounded-full" asChild>
                  <Link to="/app/goals">Voir le détail</Link>
                </Button>
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
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Configurez votre nutrition puis fixez un poids cible pour suivre
                votre progression.
              </p>
              <Button
                type="button"
                className="rounded-full"
                onClick={() => {
                  setWizardMode('create')
                  setWizardOpen(true)
                }}
              >
                Configurer mon objectif
              </Button>
            </div>
          )}

          {(error || adjustError) && (
            <FormMessage>{error ?? adjustError}</FormMessage>
          )}
        </CardContent>
      </Card>

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
