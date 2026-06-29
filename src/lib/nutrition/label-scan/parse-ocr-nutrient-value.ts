const MAX_MACRO_PER_100G = 100
const MAX_KCAL_PER_100G = 9_999

export function clampMacro(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > MAX_MACRO_PER_100G) {
    return null
  }

  return Math.round(value * 100) / 100
}

export function clampKcal(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > MAX_KCAL_PER_100G) {
    return null
  }

  return Math.round(value * 10) / 10
}

function repairMissingDecimalPoint(value: number, max: number): number | null {
  if (value <= max) {
    return value
  }

  let repaired = value
  while (repaired > max && repaired >= 10) {
    repaired /= 10
  }

  return repaired <= max ? repaired : null
}

function parseLeadingZeroDecimal(raw: string): number | null {
  if (!/^0\d$/.test(raw)) {
    return null
  }

  return Number(raw) / 10
}

export function parseOcrMacroValue(raw: string): number | null {
  const token = raw.trim().replace(',', '.')
  if (token === '' || /^[oO]$/.test(token)) {
    return 0
  }

  const leadingZero = parseLeadingZeroDecimal(token)
  if (leadingZero != null) {
    return clampMacro(leadingZero)
  }

  const match = token.match(/(\d+(?:\.\d+)?)/)
  if (!match) {
    return null
  }

  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) {
    return null
  }

  if (parsed > MAX_MACRO_PER_100G) {
    const repaired = repairMissingDecimalPoint(parsed, MAX_MACRO_PER_100G)
    return repaired == null ? null : clampMacro(repaired)
  }

  return clampMacro(parsed)
}

export function parseOcrKcalValue(raw: string): number | null {
  const token = raw.trim().replace(',', '.')
  const match = token.match(/(\d+(?:\.\d+)?)/)
  if (!match) {
    return null
  }

  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) {
    return null
  }

  if (parsed > MAX_KCAL_PER_100G) {
    const repaired = repairMissingDecimalPoint(parsed, MAX_KCAL_PER_100G)
    return repaired == null ? null : clampKcal(repaired)
  }

  return clampKcal(parsed)
}

export function extractNumericTokens(tail: string): string[] {
  return [...tail.matchAll(/(\d+[,.]?\d*)/g)].map((match) => match[1])
}

export function extractFirstMacroFromTail(tail: string): number | null {
  if (/\btraces?\b/i.test(tail)) {
    return 0
  }

  const lessThanMatch = tail.match(/<\s*(\d+[,.]?\d*)/i)
  if (lessThanMatch) {
    return parseOcrMacroValue(lessThanMatch[1]) ?? 0
  }

  if (/\b0\s*g\b/i.test(tail) || /\bog\b/i.test(tail)) {
    return 0
  }

  const gramMatch = tail.match(/(\d+[,.]?\d*)\s*g\b/i)
  if (gramMatch) {
    return parseOcrMacroValue(gramMatch[1])
  }

  for (const token of extractNumericTokens(tail)) {
    const parsed = parseOcrMacroValue(token)
    if (parsed != null) {
      return parsed
    }
  }

  return null
}

export function extractFirstKcalFromTail(tail: string): number | null {
  const kcalMatches = [...tail.matchAll(/(\d+[,.]?\d*)\s*kcal/gi)]
  if (kcalMatches.length > 0) {
    return parseOcrKcalValue(kcalMatches[0][1])
  }

  const kjMatch = tail.match(/(\d+[,.]?\d*)\s*kJ/i)
  if (kjMatch) {
    const kj = Number(kjMatch[1].replace(',', '.'))
    if (!Number.isFinite(kj)) {
      return null
    }
    return clampKcal(Math.round(kj / 4.184))
  }

  return null
}

export function nutrientTailFromLine(line: string): string {
  const colonIndex = line.indexOf(':')
  return colonIndex >= 0 ? line.slice(colonIndex + 1) : line
}
