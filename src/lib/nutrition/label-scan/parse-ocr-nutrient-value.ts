import { referenceColumnTail, splitNutritionColumns } from '@/lib/nutrition/label-scan/split-nutrition-columns'

const MAX_MACRO_PER_100G = 100
const MAX_KCAL_PER_100G = 9_999
const MAX_SALT_FROM_SODIUM_MG = 100

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

function parseMgToGrams(raw: string): number | null {
  const match = raw.match(/(\d+[,.]?\d*)\s*mg\b/i)
  if (!match) {
    return null
  }

  const mg = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(mg)) {
    return null
  }

  return clampMacro(mg / 1_000)
}

function parseSodiumMgToSaltGrams(raw: string): number | null {
  const match = raw.match(/(\d+[,.]?\d*)\s*mg\b/i)
  if (!match) {
    return null
  }

  const mg = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(mg) || mg > MAX_SALT_FROM_SODIUM_MG * 1_000) {
    return null
  }

  return clampMacro((mg * 2.5) / 1_000)
}

function extractMacroFromColumn(column: string): number | null {
  if (/\btraces?\b/i.test(column)) {
    return 0
  }

  const lessThanMatch = column.match(/<\s*(\d+[,.]?\d*)/i)
  if (lessThanMatch) {
    return parseOcrMacroValue(lessThanMatch[1]) ?? 0
  }

  if (/\b0\s*g\b/i.test(column) || /\bog\b/i.test(column)) {
    return 0
  }

  const gramMatch = column.match(/(\d+[,.]?\d*)\s*g\b/i)
  if (gramMatch) {
    return parseOcrMacroValue(gramMatch[1])
  }

  const mgAsGrams = parseMgToGrams(column)
  if (mgAsGrams != null) {
    return mgAsGrams
  }

  const tokens = [...column.matchAll(/(\d+[,.]?\d*)/g)].map((match) => match[1])
  for (const token of tokens) {
    const parsed = parseOcrMacroValue(token)
    if (parsed != null) {
      return parsed
    }
  }

  return null
}

export function extractFirstMacroFromTail(tail: string): number | null {
  const referenceTail = referenceColumnTail(tail)
  const fromReference = extractMacroFromColumn(referenceTail)
  if (fromReference != null) {
    return fromReference
  }

  for (const column of splitNutritionColumns(tail)) {
    const parsed = extractMacroFromColumn(column)
    if (parsed != null) {
      return parsed
    }
  }

  return extractMacroFromColumn(tail)
}

export function extractSaltFromTail(tail: string, lineContext = ''): number | null {
  const treatMgAsSodium = /sodium/i.test(lineContext) || /sodium/i.test(tail)
  const columns = splitNutritionColumns(tail)
  const candidates = columns.length > 0 ? columns : [tail]

  for (const column of candidates) {
    if (/sodium/i.test(column)) {
      const fromSodium = parseSodiumMgToSaltGrams(column)
      if (fromSodium != null) {
        return fromSodium
      }
    }

    const mgMatch = column.match(/(\d+[,.]?\d*)\s*mg\b/i)
    if (mgMatch && treatMgAsSodium) {
      const fromSodium = parseSodiumMgToSaltGrams(column)
      if (fromSodium != null) {
        return fromSodium
      }
    }

    const fromGrams = extractMacroFromColumn(column)
    if (fromGrams != null) {
      return fromGrams
    }
  }

  return null
}

export function extractFirstKcalFromTail(tail: string): number | null {
  const referenceTail = referenceColumnTail(tail)
  const kcalMatches = [...referenceTail.matchAll(/(\d+[,.]?\d*)\s*kcal/gi)]
  if (kcalMatches.length > 0) {
    return parseOcrKcalValue(kcalMatches[0][1])
  }

  for (const column of splitNutritionColumns(tail)) {
    const columnKcal = [...column.matchAll(/(\d+[,.]?\d*)\s*kcal/gi)]
    if (columnKcal.length > 0) {
      return parseOcrKcalValue(columnKcal[0][1])
    }
  }

  const kjMatch = referenceColumnTail(tail).match(/(\d+[,.]?\d*)\s*kJ/i)
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
