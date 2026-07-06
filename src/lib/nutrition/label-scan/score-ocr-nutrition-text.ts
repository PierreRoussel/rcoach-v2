import { parseNutritionLabelFr } from '@/lib/nutrition/label-scan/parse-nutrition-label-fr'

const NUTRITION_KEYWORDS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /d[eé]claration\s+nutritionnelle/i, weight: 4 },
  { pattern: /glucides|jucides/i, weight: 5 },
  { pattern: /énergie|énergétique|kcal/i, weight: 5 },
  { pattern: /prot[eé]ines|foteines/i, weight: 4 },
  { pattern: /mati[eè]res?\s+grasses|lipides/i, weight: 4 },
  { pattern: /dont\s*sucres|dontsucres/i, weight: 3 },
  { pattern: /acides?\s+gras\s+satur/i, weight: 3 },
  { pattern: /\bsel\b/i, weight: 3 },
  { pattern: /pour\s*100\s*(ml|g)/i, weight: 4 },
]

export function scoreOcrNutritionText(text: string): number {
  if (!text.trim()) {
    return 0
  }

  let score = 0
  for (const { pattern, weight } of NUTRITION_KEYWORDS) {
    if (pattern.test(text)) {
      score += weight
    }
  }

  const nutrientLines = text.match(/:\s*\d/gi)?.length ?? 0
  score += Math.min(nutrientLines * 2, 12)

  return score
}

export function scoreOcrNutritionParse(text: string): number {
  if (!text.trim()) {
    return 0
  }

  let score = scoreOcrNutritionText(text)
  const result = parseNutritionLabelFr(text)
  const { nutrients } = result

  if (nutrients.calories != null) {
    score += 8
  }
  if (nutrients.carbsG != null) {
    score += 6
  }
  if (nutrients.proteinG != null) {
    score += 6
  }
  if (nutrients.fatG != null) {
    score += 6
  }
  if (nutrients.sugarG != null) {
    score += 2
  }
  if (nutrients.saturatedFatG != null) {
    score += 2
  }
  if (nutrients.saltG != null) {
    score += 2
  }

  if (result.confidence === 'high') {
    score += 8
  } else if (result.confidence === 'medium') {
    score += 4
  }

  if (result.fieldHints.calories) {
    score += 2
  }

  return score
}
