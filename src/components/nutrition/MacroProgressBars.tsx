import { Progress } from '@/components/ui/progress'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { cn } from '@/lib/utils'

type MacroProgressBarsProps = {
  carbs: { current: number; target: number }
  protein: { current: number; target: number }
  fat: { current: number; target: number }
  className?: string
}

function MacroBar({
  label,
  current,
  target,
}: {
  label: string
  current: number
  target: number
}) {
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {formatNutrient(current)} / {formatNutrient(target)} g
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}

export function MacroProgressBars({
  carbs,
  protein,
  fat,
  className,
}: MacroProgressBarsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <MacroBar label="Glucides" current={carbs.current} target={carbs.target} />
      <MacroBar label="Proteines" current={protein.current} target={protein.target} />
      <MacroBar label="Lipides" current={fat.current} target={fat.target} />
    </div>
  )
}
