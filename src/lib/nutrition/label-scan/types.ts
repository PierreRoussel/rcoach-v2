export type ParsedNutritionLabel = {
  calories: number | null
  carbsG: number | null
  proteinG: number | null
  fatG: number | null
  saltG: number | null
  sugarG: number | null
  saturatedFatG: number | null
}

export function parsedLabelHasMacros(parsed: ParsedNutritionLabel): boolean {
  return (
    parsed.calories != null ||
    parsed.carbsG != null ||
    parsed.proteinG != null ||
    parsed.fatG != null
  )
}
