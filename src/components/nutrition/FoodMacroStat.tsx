import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { isGoodProteinPer100g } from '@/lib/nutrition/food-nutrient-quality'
import { cn } from '@/lib/utils'

type FoodMacroStatProps = {
  label: string
  value: number
  proteinPer100g?: number | null
  className?: string
}

export function FoodMacroStat({
  label,
  value,
  proteinPer100g,
  className,
}: FoodMacroStatProps) {
  const highlightProtein =
    proteinPer100g != null && isGoodProteinPer100g(Number(proteinPer100g))

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-3 text-center',
        highlightProtein
          ? 'border-secondary/40 bg-gradient-to-br from-soft-secondary via-soft-secondary/45 to-card'
          : 'border-border/70 bg-card',
        className,
      )}
    >
      <div
        className={cn(
          'font-display text-xl font-black tabular-nums',
          highlightProtein ? 'text-secondary-foreground' : 'text-foreground',
        )}
      >
        {formatNutrient(value)} g
      </div>
      <div
        className={cn(
          'mt-1 text-xs font-medium',
          highlightProtein ? 'text-secondary' : 'text-muted-foreground',
        )}
      >
        {label}
      </div>
    </div>
  )
}
