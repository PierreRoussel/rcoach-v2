import type {
  LabelParseConfidence,
  ParsedNutritionFieldHintKey,
  ParsedNutritionLabel,
} from '@/lib/nutrition/label-scan/types'
import { parsedLabelHasMacros } from '@/lib/nutrition/label-scan/types'

const KCAL_TOLERANCE_RATIO = 0.2

export const CALORIES_DERIVED_FIELD_HINT =
  'Valeur calculée à partir des macros (4/4/9) — vérifiez la saisie.'

type ValidationResult = {
  nutrients: ParsedNutritionLabel
  warnings: string[]
  confidence: LabelParseConfidence
  fieldHints: Partial<Record<ParsedNutritionFieldHintKey, string>>
}

export function estimateKcalFromMacros(nutrients: ParsedNutritionLabel): number | null {
  const { carbsG, proteinG, fatG } = nutrients
  if (carbsG == null && proteinG == null && fatG == null) {
    return null
  }

  return (carbsG ?? 0) * 4 + (proteinG ?? 0) * 4 + (fatG ?? 0) * 9
}

function hasMacroBasis(nutrients: ParsedNutritionLabel): boolean {
  return nutrients.carbsG != null || nutrients.proteinG != null || nutrients.fatG != null
}

function countFilledMacros(nutrients: ParsedNutritionLabel): number {
  return [
    nutrients.calories,
    nutrients.carbsG,
    nutrients.proteinG,
    nutrients.fatG,
    nutrients.sugarG,
    nutrients.saturatedFatG,
    nutrients.saltG,
  ].filter((value) => value != null).length
}

export function validateParsedNutrition(
  nutrients: ParsedNutritionLabel,
): ValidationResult {
  const warnings: string[] = []
  const fieldHints: Partial<Record<ParsedNutritionFieldHintKey, string>> = {}
  const adjusted: ParsedNutritionLabel = { ...nutrients }
  let caloriesDerived = false

  if (
    adjusted.sugarG != null &&
    adjusted.carbsG != null &&
    adjusted.sugarG > adjusted.carbsG
  ) {
    warnings.push('Les sucres dépassent les glucides — vérifiez la colonne 100 g/ml.')
    adjusted.sugarG = adjusted.carbsG
  }

  if (
    adjusted.saturatedFatG != null &&
    adjusted.fatG != null &&
    adjusted.saturatedFatG > adjusted.fatG
  ) {
    warnings.push('Les gras saturés dépassent les lipides — valeur ajustée.')
    adjusted.saturatedFatG = adjusted.fatG
  }

  if (adjusted.calories == null && hasMacroBasis(adjusted)) {
    const estimated = estimateKcalFromMacros(adjusted)
    if (estimated != null) {
      adjusted.calories = Math.round(estimated)
      caloriesDerived = true
      fieldHints.calories = CALORIES_DERIVED_FIELD_HINT
      warnings.push('Énergie déduite des macros (4/4/9).')
    }
  }

  const estimated = estimateKcalFromMacros(adjusted)
  if (
    !caloriesDerived &&
    adjusted.calories != null &&
    estimated != null &&
    estimated > 0
  ) {
    const delta = Math.abs(adjusted.calories - estimated) / estimated
    if (delta > KCAL_TOLERANCE_RATIO) {
      warnings.push(
        `Énergie (${adjusted.calories} kcal) peu cohérente avec les macros (≈ ${Math.round(estimated)} kcal).`,
      )
    }
  }

  const filled = countFilledMacros(adjusted)
  let confidence: LabelParseConfidence = 'low'
  if (filled >= 5 && warnings.length === 0) {
    confidence = 'high'
  } else if (filled >= 3 && warnings.length <= 1) {
    confidence = 'medium'
  }

  if (caloriesDerived && confidence === 'high') {
    confidence = 'medium'
  }

  if (!parsedLabelHasMacros(adjusted)) {
    confidence = 'low'
  }

  return {
    nutrients: adjusted,
    warnings,
    confidence,
    fieldHints,
  }
}
