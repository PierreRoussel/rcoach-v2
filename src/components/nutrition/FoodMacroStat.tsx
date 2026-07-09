import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { isGoodProteinPer100g } from '@/lib/nutrition/food-nutrient-quality'
import {
  macroStatSurfaceStyle,
  macroStatTextStyle,
  resolveMacroNutrient,
  type MacroNutrient,
} from '@/lib/nutrition/macro-visuals'
import { cn } from '@/lib/utils'

type FoodMacroStatProps = {
  label: string
  value: number
  macro?: MacroNutrient
  proteinPer100g?: number | null
  className?: string
}

export function FoodMacroStat({
  label,
  value,
  macro,
  proteinPer100g,
  className,
}: FoodMacroStatProps) {
  const resolvedMacro = macro ?? resolveMacroNutrient(label)
  const highlightProtein =
    resolvedMacro === 'protein' &&
    proteinPer100g != null &&
    isGoodProteinPer100g(Number(proteinPer100g))

  return (
    <div
      className={cn('rounded-xl border px-3 py-3 text-center', className)}
      style={resolvedMacro ? macroStatSurfaceStyle(resolvedMacro) : undefined}
      data-macro={resolvedMacro ?? undefined}
    >
      <div
        className={cn(
          'font-display text-xl font-black tabular-nums',
          !resolvedMacro && 'text-foreground',
        )}
        style={resolvedMacro ? macroStatTextStyle(resolvedMacro) : undefined}
      >
        {formatNutrient(value)} g
      </div>
      <div
        className={cn(
          'mt-1 text-xs font-medium',
          !resolvedMacro && (highlightProtein ? 'text-secondary' : 'text-muted-foreground'),
        )}
        style={
          resolvedMacro
            ? {
                ...macroStatTextStyle(resolvedMacro),
                opacity: 0.82,
              }
            : undefined
        }
      >
        {label}
      </div>
    </div>
  )
}
