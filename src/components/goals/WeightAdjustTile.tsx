import { Minus, Plus } from 'lucide-react'

import { WeightProgressSinceStartBadge } from '@/components/goals/WeightProgressSinceStartBadge'
import { Button } from '@/components/ui/button'
import { formatWeightKg, type WeightGoal } from '@/lib/goals/weight-goal'
import { cn } from '@/lib/utils'

type WeightAdjustTileProps = {
  goal: Pick<WeightGoal, 'goal_type' | 'start_weight_kg' | 'current_weight_kg'>
  disabled?: boolean
  onAdjust: (deltaSteps: number) => void
  className?: string
}

export function WeightAdjustTile({
  goal,
  disabled = false,
  onAdjust,
  className,
}: WeightAdjustTileProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-secondary/20 bg-gradient-to-br from-soft-secondary/80 via-card to-soft-secondary/40 p-4 shadow-sm',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-secondary/15 to-transparent"
        aria-hidden
      />
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground">Poids actuel</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-border/80 bg-card/80 backdrop-blur-sm"
            disabled={disabled}
            onClick={() => onAdjust(-1)}
            aria-label="Diminuer le poids de 100 g"
          >
            <Minus className="size-4" />
          </Button>

          <div className="text-center">
            <p className="font-display text-3xl font-black text-foreground">
              {formatWeightKg(goal.current_weight_kg)}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-border/80 bg-card/80 backdrop-blur-sm"
            disabled={disabled}
            onClick={() => onAdjust(1)}
            aria-label="Augmenter le poids de 100 g"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex justify-center">
          <WeightProgressSinceStartBadge goal={goal} />
        </div>
      </div>
    </div>
  )
}
