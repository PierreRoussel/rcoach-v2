function normalizePollutionProbe(line: string): string {
  return line
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const POLLUTING_LINE_PATTERNS: RegExp[] = [
  /apports?\s+de\s+r[eé]f[eé]rence/,
  /r[eé]f[eé]rence\s+pour\s+(un\s+)?adulte/,
  /adulte[- ]type/,
  /adulte\s+moyen/,
  /valeurs?\s+nutritionnelles?\s+moyennes?\s+recommand/,
  /bas[eé]\s+sur\s+(un\s+)?apport/,
  /pourcentages?\s+(sont\s+)?calcul[eé]s/,
  /\breference\s+intake\b/,
  /\bdaily\s+reference\b/,
  /\bGDA\b/,
  /\bVNR\b/,
  /\bAJR\b/,
]

export function isPollutingNutritionLine(line: string): boolean {
  const normalized = normalizePollutionProbe(line)
  if (!normalized) {
    return false
  }

  if (POLLUTING_LINE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true
  }

  const hasAdultReferenceContext = /(adulte|r[eé]f[eé]rence|reference|apport)/.test(
    normalized,
  )
  const hasDailyReferenceEnergy =
    /8\s*400\s*kJ/.test(normalized) && /2\s*000\s*kcal/.test(normalized)

  if (hasDailyReferenceEnergy) {
    return true
  }

  if (hasAdultReferenceContext && /2\s*000\s*kcal/.test(normalized)) {
    return true
  }

  if (hasAdultReferenceContext && /8\s*400\s*kJ/.test(normalized) && !/énergie|énergétique|energie/.test(normalized)) {
    return true
  }

  return false
}

export function filterNutritionTableLines(lines: string[]): string[] {
  return lines.filter((line) => !isPollutingNutritionLine(line))
}
