import { Progress } from '@/components/ui/progress'
import {
  MACRO_NUTRIENT_LABELS,
  macroIndicatorStyle,
  macroStatTextStyle,
  macroTrackStyle,
  type MacroNutrient,
} from '@/lib/nutrition/macro-visuals'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { cn } from '@/lib/utils'

type MacroProgressBarsProps = {
  carbs: { current: number; target: number }
  protein: { current: number; target: number }
  fat: { current: number; target: number }
  className?: string
}

function MacroBar({
  macro,
  current,
  target,
}: {
  macro: MacroNutrient
  current: number
  target: number
}) {
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div className="macro-bar flex min-w-0 flex-col gap-1.5" data-macro={macro}>
      <span
        className="text-xs font-semibold"
        style={macroStatTextStyle(macro)}
      >
        {MACRO_NUTRIENT_LABELS[macro]}
      </span>
      <Progress
        value={progress}
        className="macro-bar__progress h-2 border-0 bg-transparent"
        trackStyle={macroTrackStyle(macro)}
        indicatorStyle={macroIndicatorStyle(macro)}
      />
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
      <MacroBar macro="carbs" current={carbs.current} target={carbs.target} />
      <MacroBar macro="protein" current={protein.current} target={protein.target} />
      <MacroBar macro="fat" current={fat.current} target={fat.target} />
    </div>
  )
}
