import type { NutritionReferenceBasis } from '@/lib/nutrition/label-scan/types'

export function detectReferenceBasis(text: string): NutritionReferenceBasis {
  const normalized = text.normalize('NFC').toLowerCase()

  const explicitPour = normalized.match(/pour\s*[:\s]*100\s*(ml|g)\b/)
  if (explicitPour) {
    return explicitPour[1] === 'ml' ? '100ml' : '100g'
  }

  const has100Ml =
    /\b100\s*ml\b/.test(normalized) ||
    /\/\s*100\s*ml\b/.test(normalized) ||
    /pour\s*100\s*ml\b/.test(normalized)
  const has100G = /\b100\s*g\b/.test(normalized) || /pour\s*100\s*g\b/.test(normalized)

  if (has100Ml && !has100G) {
    return '100ml'
  }

  return '100g'
}

export function servingLabelForBasis(basis: NutritionReferenceBasis): string {
  return basis === '100ml' ? '100 ml' : '100 g'
}
