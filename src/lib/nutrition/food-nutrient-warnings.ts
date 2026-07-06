export type FoodNutrientFieldKey =
  | 'calories'
  | 'carbsG'
  | 'proteinG'
  | 'fatG'
  | 'saltG'
  | 'sugarG'
  | 'saturatedFatG'
  | 'servingSizeG'

export type FoodNutrientInputValues = Record<FoodNutrientFieldKey, string>

const KCAL_SOFT_MAX = 900
const KCAL_HARD_MAX = 1_000
const MACRO_SOFT_MAX = 100
const SALT_SOFT_MAX = 6
const SALT_HARD_MAX = 15
const SERVING_SOFT_MIN = 1
const SERVING_SOFT_MAX = 2_000
const KCAL_MACRO_TOLERANCE = 0.25

function parseInputNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return null
  }

  const parsed = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function estimatedKcalFromMacros(values: FoodNutrientInputValues): number | null {
  const carbsG = parseInputNumber(values.carbsG)
  const proteinG = parseInputNumber(values.proteinG)
  const fatG = parseInputNumber(values.fatG)

  if (carbsG == null && proteinG == null && fatG == null) {
    return null
  }

  return (carbsG ?? 0) * 4 + (proteinG ?? 0) * 4 + (fatG ?? 0) * 9
}

function warnIfOutOfRange(
  value: number,
  softMax: number,
  hardMax: number,
  unit: string,
  label: string,
): string | null {
  if (value < 0) {
    return `${label} ne peut pas être négatif.`
  }

  if (value > hardMax) {
    return `${value} ${unit} semble impossible pour 100 g/ml.`
  }

  if (value > softMax) {
    return `${value} ${unit} semble élevé pour 100 g/ml — vérifiez la saisie.`
  }

  return null
}

export function getFoodNutrientWarning(
  field: FoodNutrientFieldKey,
  rawValue: string,
  allValues: FoodNutrientInputValues,
): string | null {
  const value = parseInputNumber(rawValue)
  if (value == null) {
    return null
  }

  switch (field) {
    case 'calories': {
      const rangeWarning = warnIfOutOfRange(value, KCAL_SOFT_MAX, KCAL_HARD_MAX, 'kcal', 'Cette énergie')
      if (rangeWarning) {
        return rangeWarning
      }

      const estimated = estimatedKcalFromMacros(allValues)
      if (estimated != null && estimated > 0) {
        const delta = Math.abs(value - estimated) / estimated
        if (delta > KCAL_MACRO_TOLERANCE) {
          return `Peu cohérent avec les macros (≈ ${Math.round(estimated)} kcal attendues).`
        }
      }

      return null
    }
    case 'carbsG':
      return warnIfOutOfRange(value, MACRO_SOFT_MAX, MACRO_SOFT_MAX, 'g', 'Cette valeur')
    case 'proteinG':
      return warnIfOutOfRange(value, MACRO_SOFT_MAX, MACRO_SOFT_MAX, 'g', 'Cette valeur')
    case 'fatG':
      return warnIfOutOfRange(value, MACRO_SOFT_MAX, MACRO_SOFT_MAX, 'g', 'Cette valeur')
    case 'saltG':
      return warnIfOutOfRange(value, SALT_SOFT_MAX, SALT_HARD_MAX, 'g', 'Ce sel')
    case 'sugarG': {
      const rangeWarning = warnIfOutOfRange(value, MACRO_SOFT_MAX, MACRO_SOFT_MAX, 'g', 'Cette valeur')
      if (rangeWarning) {
        return rangeWarning
      }

      const carbsG = parseInputNumber(allValues.carbsG)
      if (carbsG != null && value > carbsG) {
        return 'Les sucres dépassent les glucides — vérifiez la saisie.'
      }

      return null
    }
    case 'saturatedFatG': {
      const rangeWarning = warnIfOutOfRange(value, MACRO_SOFT_MAX, MACRO_SOFT_MAX, 'g', 'Cette valeur')
      if (rangeWarning) {
        return rangeWarning
      }

      const fatG = parseInputNumber(allValues.fatG)
      if (fatG != null && value > fatG) {
        return 'Les gras saturés dépassent les lipides — vérifiez la saisie.'
      }

      return null
    }
    case 'servingSizeG': {
      if (value <= 0) {
        return 'La portion doit être supérieure à 0.'
      }

      if (value < SERVING_SOFT_MIN) {
        return 'Portion très petite — vérifiez la valeur.'
      }

      if (value > SERVING_SOFT_MAX) {
        return 'Portion inhabituelle — vérifiez la valeur.'
      }

      return null
    }
    default:
      return null
  }
}
