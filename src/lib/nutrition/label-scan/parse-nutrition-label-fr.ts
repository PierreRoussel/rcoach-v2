import type { ParsedNutritionLabel } from '@/lib/nutrition/label-scan/types'
import { normalizeOcrText } from '@/lib/nutrition/label-scan/normalize-ocr-text'
import {
  clampKcal,
  extractFirstMacroFromTail,
  parseOcrKcalValue,
} from '@/lib/nutrition/label-scan/parse-ocr-nutrient-value'

type NutrientField = keyof Omit<ParsedNutritionLabel, never>

type NutrientRule = {
  field: NutrientField
  matches: RegExp[]
  extract: (line: string) => number | null
}

function normalizeLine(line: string): string {
  return line
    .normalize('NFC')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function lineMatches(line: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(line))
}

function extractMacroFromLine(line: string): number | null {
  return extractFirstMacroFromTail(
    line.includes(':') ? line.slice(line.indexOf(':') + 1) : line,
  )
}

function extractCaloriesFromLabel(text: string, lines: string[]): number | null {
  for (const rawLine of lines) {
    const kcalMatches = [...rawLine.matchAll(/(\d+[,.]?\d*)\s*kcal/gi)]
    if (kcalMatches.length > 0) {
      const parsed = parseOcrKcalValue(kcalMatches[0][1])
      if (parsed != null) {
        return parsed
      }
    }
  }

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine)
    if (!/énergie|énergétique/.test(line)) {
      continue
    }

    const kjMatches = [...rawLine.matchAll(/(\d+[,.]?\d*)\s*kJ/gi)]
    if (kjMatches.length > 0) {
      const kj = Number(kjMatches[0][1].replace(',', '.'))
      if (Number.isFinite(kj)) {
        return clampKcal(Math.round(kj / 4.184))
      }
    }
  }

  const wholeTextKcal = text.match(/(\d+[,.]?\d*)\s*kcal/i)
  if (wholeTextKcal) {
    const parsed = parseOcrKcalValue(wholeTextKcal[1])
    if (parsed != null) {
      return parsed
    }
  }

  const wholeTextKj = text.match(/(\d+[,.]?\d*)\s*kJ/i)
  if (wholeTextKj) {
    const kj = Number(wholeTextKj[1].replace(',', '.'))
    if (Number.isFinite(kj)) {
      return clampKcal(Math.round(kj / 4.184))
    }
  }

  return null
}

const NUTRIENT_RULES: NutrientRule[] = [
  {
    field: 'saturatedFatG',
    matches: [/acides?\s+gras\s+satur/, /gras\s+satur/, /dont.*satur/],
    extract: extractMacroFromLine,
  },
  {
    field: 'fatG',
    matches: [/matières?\s+grasses?/, /^lipides?\b/, /\blipides?\b/],
    extract: extractMacroFromLine,
  },
  {
    field: 'sugarG',
    matches: [/dont\s+sucres?/, /\bdont\s+sucre\b/, /dontsucres?/],
    extract: extractMacroFromLine,
  },
  {
    field: 'carbsG',
    matches: [/^glucides?\b/, /\bglucides?\b/, /^jucides?\b/, /\bjucides?\b/],
    extract: extractMacroFromLine,
  },
  {
    field: 'proteinG',
    matches: [/protéines?/, /proteines?/, /foteines?/],
    extract: extractMacroFromLine,
  },
  {
    field: 'saltG',
    matches: [/^sel\b/, /\bsel\b/],
    extract: extractMacroFromLine,
  },
]

function emptyParsedLabel(): ParsedNutritionLabel {
  return {
    calories: null,
    carbsG: null,
    proteinG: null,
    fatG: null,
    saltG: null,
    sugarG: null,
    saturatedFatG: null,
  }
}

function shouldSkipRule(line: string, rule: NutrientRule): boolean {
  if (rule.field === 'fatG' && lineMatches(line, [/satur/])) {
    return true
  }

  if (
    rule.field === 'carbsG' &&
    lineMatches(line, [/dont\s+sucres?/, /dontsucres?/, /polyols?/])
  ) {
    return true
  }

  return false
}

function scanLines(lines: string[]): ParsedNutritionLabel {
  const result = emptyParsedLabel()

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine)
    if (!line) {
      continue
    }

    for (const rule of NUTRIENT_RULES) {
      if (result[rule.field] != null || shouldSkipRule(line, rule)) {
        continue
      }

      if (!lineMatches(line, rule.matches)) {
        continue
      }

      result[rule.field] = rule.extract(rawLine)
    }
  }

  return result
}

function scanWholeText(text: string, current: ParsedNutritionLabel): ParsedNutritionLabel {
  const result = { ...current }

  const wholeTextRules: Array<{
    field: NutrientField
    pattern: RegExp
    extract: (match: RegExpMatchArray) => number | null
  }> = [
    {
      field: 'carbsG',
      pattern: /(?:glucides?|jucides?)\s*:\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
    {
      field: 'proteinG',
      pattern: /(?:prot[eé]ines?|foteines?)\s*:\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
    {
      field: 'fatG',
      pattern: /mati[eè]res?\s+grasses?\s*:\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
    {
      field: 'saturatedFatG',
      pattern: /dont\s+acides?\s+gras\s+satur[eé]s?\s*:\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
    {
      field: 'sugarG',
      pattern: /dont\s*sucres?\s*[: ]?\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
    {
      field: 'saltG',
      pattern: /\bsel\s*:\s*([^;\n]+)/i,
      extract: (match) => extractFirstMacroFromTail(match[1]),
    },
  ]

  for (const rule of wholeTextRules) {
    if (result[rule.field] != null) {
      continue
    }

    const match = text.match(rule.pattern)
    if (!match) {
      continue
    }

    result[rule.field] = rule.extract(match)
  }

  return result
}

export function parseNutritionLabelFr(text: string): ParsedNutritionLabel {
  const normalized = normalizeOcrText(text)
  if (!normalized.trim()) {
    return emptyParsedLabel()
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const fromLines = scanLines(lines)
  const fromWholeText = scanWholeText(normalized, fromLines)

  return {
    ...fromWholeText,
    calories: extractCaloriesFromLabel(normalized, lines),
  }
}

export function formatParsedNutrientForInput(value: number | null): string {
  if (value == null) {
    return ''
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(value)
}
