import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import {
  getSaturatedFatQualityLevel,
  getSugarQualityLevel,
  type NutrientQualityLevel,
} from '@/lib/nutrition/food-nutrient-quality'
import type { Food } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

type FoodNutrientBadgesProps = {
  food: Pick<Food, 'sugar_g' | 'saturated_fat_g'>
  className?: string
}

const badgeToneClasses: Record<
  Extract<NutrientQualityLevel, 'low' | 'high'>,
  string
> = {
  low: 'border-secondary/40 bg-soft-secondary text-secondary-foreground',
  high: 'border-[var(--nutrient-warning-border)] bg-[var(--nutrient-warning-bg)] text-[var(--nutrient-warning-fg)]',
}

function NutrientBadge({
  label,
  valueG,
  level,
}: {
  label: string
  valueG: number
  level: NutrientQualityLevel
}) {
  if (level === 'medium') {
    return (
      <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        {label} {formatNutrient(valueG)} g / 100 g
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        badgeToneClasses[level],
      )}
    >
      {label} {formatNutrient(valueG)} g / 100 g
    </span>
  )
}

export function FoodNutrientBadges({ food, className }: FoodNutrientBadgesProps) {
  const badges: Array<{ key: string; label: string; valueG: number; level: NutrientQualityLevel }> = []

  if (food.sugar_g != null) {
    badges.push({
      key: 'sugar',
      label: 'Sucres',
      valueG: Number(food.sugar_g),
      level: getSugarQualityLevel(Number(food.sugar_g)),
    })
  }

  if (food.saturated_fat_g != null) {
    badges.push({
      key: 'saturated-fat',
      label: 'Gras saturés',
      valueG: Number(food.saturated_fat_g),
      level: getSaturatedFatQualityLevel(Number(food.saturated_fat_g)),
    })
  }

  if (badges.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges.map((badge) => (
        <NutrientBadge
          key={badge.key}
          label={badge.label}
          valueG={badge.valueG}
          level={badge.level}
        />
      ))}
    </div>
  )
}
