import { Link } from '@tanstack/react-router'
import { Target } from 'lucide-react'
import { useState } from 'react'

import { WeightAdjustTile } from '@/components/goals/WeightAdjustTile'
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
import { useResolvedWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatWeightKg,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'

export function GoalsSection() {
  const { data: goal, isLoading: goalLoading } = useResolvedWeightGoal()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null)

  const { adjustWeight, isPending: adjustPending, error: adjustError } =
    useAdjustWeightGoal({
      onMilestone: (count) => {
        setMilestoneCount(count)
        setMilestoneOpen(true)
      },
    })

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

              <WeightAdjustTile
                goal={goal}
                disabled={adjustPending}
                onAdjust={(delta) => void adjustWeight(goal, delta)}
              />

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

          {adjustError && <FormMessage>{adjustError}</FormMessage>}
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
