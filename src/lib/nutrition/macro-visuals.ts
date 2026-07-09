import type { CSSProperties } from 'react'

export type MacroNutrient = 'carbs' | 'protein' | 'fat'

export const MACRO_NUTRIENT_LABELS: Record<MacroNutrient, string> = {
  carbs: 'Glucides',
  protein: 'Protéines',
  fat: 'Lipides',
}

export const MACRO_CHART_COLORS: Record<MacroNutrient, string> = {
  carbs: 'var(--chart-3)',
  protein: 'var(--chart-2)',
  fat: 'var(--chart-5)',
}

export type MacroGrams = {
  carbsG: number
  proteinG: number
  fatG: number
}

export function resolveMacroNutrient(label: string): MacroNutrient | null {
  const normalized = label.trim().toLowerCase()

  if (normalized.startsWith('gluc')) {
    return 'carbs'
  }

  if (normalized.startsWith('prot')) {
    return 'protein'
  }

  if (normalized.startsWith('lip') || normalized.includes('gras')) {
    return 'fat'
  }

  return null
}

export function macroCalorieShares(macros: MacroGrams): Record<MacroNutrient, number> {
  const carbsCalories = Math.max(0, macros.carbsG) * 4
  const proteinCalories = Math.max(0, macros.proteinG) * 4
  const fatCalories = Math.max(0, macros.fatG) * 9
  const total = carbsCalories + proteinCalories + fatCalories

  if (total <= 0) {
    return { carbs: 1 / 3, protein: 1 / 3, fat: 1 / 3 }
  }

  return {
    carbs: carbsCalories / total,
    protein: proteinCalories / total,
    fat: fatCalories / total,
  }
}

export type MacroArcSegment = {
  macro: MacroNutrient
  length: number
}

export function buildMacroArcSegments(
  macros: MacroGrams,
  filledLength: number,
): MacroArcSegment[] {
  if (filledLength <= 0) {
    return []
  }

  const shares = macroCalorieShares(macros)

  return (['carbs', 'protein', 'fat'] as const).map((macro) => ({
    macro,
    length: filledLength * shares[macro],
  }))
}

export function macroTrackStyle(macro: MacroNutrient): CSSProperties {
  return {
    background: `color-mix(in srgb, ${MACRO_CHART_COLORS[macro]} 22%, var(--muted))`,
  }
}

export function macroIndicatorStyle(macro: MacroNutrient): CSSProperties {
  return {
    background: MACRO_CHART_COLORS[macro],
  }
}

export function macroStatSurfaceStyle(macro: MacroNutrient): CSSProperties {
  return {
    borderColor: `color-mix(in srgb, ${MACRO_CHART_COLORS[macro]} 35%, var(--border))`,
    background: `linear-gradient(165deg, color-mix(in srgb, ${MACRO_CHART_COLORS[macro]} 16%, var(--card)) 0%, var(--card) 100%)`,
  }
}

export function macroStatTextStyle(macro: MacroNutrient): CSSProperties {
  return {
    color: MACRO_CHART_COLORS[macro],
  }
}
