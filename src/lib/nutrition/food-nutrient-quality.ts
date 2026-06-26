/** Seuils pour 100 g (références type étiquetage nutritionnel). */

export const PROTEIN_GOOD_PER_100G = 12
export const SUGAR_LOW_PER_100G = 5
export const SUGAR_HIGH_PER_100G = 15
export const SATURATED_FAT_LOW_PER_100G = 1.5
export const SATURATED_FAT_HIGH_PER_100G = 5

export type NutrientQualityLevel = 'low' | 'medium' | 'high'

export function isGoodProteinPer100g(proteinG: number) {
  return proteinG >= PROTEIN_GOOD_PER_100G
}

export function getSugarQualityLevel(sugarG: number): NutrientQualityLevel {
  if (sugarG <= SUGAR_LOW_PER_100G) {
    return 'low'
  }

  if (sugarG >= SUGAR_HIGH_PER_100G) {
    return 'high'
  }

  return 'medium'
}

export function getSaturatedFatQualityLevel(
  saturatedFatG: number,
): NutrientQualityLevel {
  if (saturatedFatG <= SATURATED_FAT_LOW_PER_100G) {
    return 'low'
  }

  if (saturatedFatG >= SATURATED_FAT_HIGH_PER_100G) {
    return 'high'
  }

  return 'medium'
}
