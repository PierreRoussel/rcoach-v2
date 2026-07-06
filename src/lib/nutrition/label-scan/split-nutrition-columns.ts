export function splitNutritionColumns(tail: string): string[] {
  return tail
    .split(/\s*[|}\]]\s*|\s*\[\s*|\s{3,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

export function referenceColumnTail(tail: string): string {
  const columns = splitNutritionColumns(tail)
  return columns[0] ?? tail
}
