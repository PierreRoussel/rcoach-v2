export type NutritionReferenceBasis = '100g' | '100ml'

export type LabelParseConfidence = 'high' | 'medium' | 'low'

export type ParsedNutritionLabel = {
  calories: number | null
  carbsG: number | null
  proteinG: number | null
  fatG: number | null
  saltG: number | null
  sugarG: number | null
  saturatedFatG: number | null
}

export type ParsedNutritionFieldHintKey = keyof ParsedNutritionLabel

export type ParsedNutritionLabelResult = {
  nutrients: ParsedNutritionLabel
  basis: NutritionReferenceBasis
  confidence: LabelParseConfidence
  warnings: string[]
  fieldHints: Partial<Record<ParsedNutritionFieldHintKey, string>>
}

export function parsedLabelHasMacros(parsed: ParsedNutritionLabel): boolean {
  return (
    parsed.calories != null ||
    parsed.carbsG != null ||
    parsed.proteinG != null ||
    parsed.fatG != null
  )
}
