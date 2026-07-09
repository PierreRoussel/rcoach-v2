import {
  macroCalorieShares,
  MACRO_CHART_COLORS,
  type MacroGrams,
} from '@/lib/nutrition/macro-visuals'
import { cn } from '@/lib/utils'

type MacroCalorieProgressProps = {
  progress: number
  macros: MacroGrams
  className?: string
}

export function MacroCalorieProgress({
  progress,
  macros,
  className,
}: MacroCalorieProgressProps) {
  const filled = Math.min(Math.max(progress, 0), 100)
  const shares = macroCalorieShares(macros)

  return (
    <div
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_80%,var(--card))]',
        className,
      )}
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex h-full transition-all duration-500" style={{ width: `${filled}%` }}>
        <div style={{ flex: shares.carbs, background: MACRO_CHART_COLORS.carbs }} />
        <div style={{ flex: shares.protein, background: MACRO_CHART_COLORS.protein }} />
        <div style={{ flex: shares.fat, background: MACRO_CHART_COLORS.fat }} />
      </div>
    </div>
  )
}
