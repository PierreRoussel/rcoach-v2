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
    <div className="macro-bar flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <Progress value={progress} className="macro-bar__progress h-2" />
      <span className="text-[10px] leading-tight text-muted-foreground">
        {formatNutrient(current)} / {formatNutrient(target)} g
      </span>
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
    <div className={cn('macro-progress-grid grid grid-cols-3 gap-2', className)}>
      <MacroBar label="Glucides" current={carbs.current} target={carbs.target} />
      <MacroBar label="Protéines" current={protein.current} target={protein.target} />
      <MacroBar label="Lipides" current={fat.current} target={fat.target} />
    </div>
  )
}
