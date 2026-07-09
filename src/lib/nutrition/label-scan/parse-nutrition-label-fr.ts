import { detectReferenceBasis } from '@/lib/nutrition/label-scan/detect-reference-basis'
import { filterNutritionTableLines } from '@/lib/nutrition/label-scan/filter-polluting-label-lines'
import { normalizeOcrText } from '@/lib/nutrition/label-scan/normalize-ocr-text'
import {
  clampKcal,
  extractFirstKcalFromTail,
  extractFirstMacroFromTail,
  extractSaltFromTail,
  nutrientTailFromLine,
} from '@/lib/nutrition/label-scan/parse-ocr-nutrient-value'
import type {
  ParsedNutritionLabel,
  ParsedNutritionLabelResult,
} from '@/lib/nutrition/label-scan/types'
import { validateParsedNutrition } from '@/lib/nutrition/label-scan/validate-parsed-nutrition'
import { referenceColumnTail } from '@/lib/nutrition/label-scan/split-nutrition-columns'

type NutrientField = keyof ParsedNutritionLabel

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
  return extractFirstMacroFromTail(nutrientTailFromLine(line))
}

function extractSaltFromLine(line: string): number | null {
  return extractSaltFromTail(nutrientTailFromLine(line), line)
}

function extractCaloriesFromLabel(lines: string[]): number | null {
  for (const rawLine of lines) {
    if (!/kcal/i.test(rawLine)) {
      continue
    }

    const fromTail = extractFirstKcalFromTail(nutrientTailFromLine(rawLine))
    if (fromTail != null) {
      return fromTail
    }

    const fromLine = extractFirstKcalFromTail(rawLine)
    if (fromLine != null) {
      return fromLine
    }
  }

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine)
    if (!/énergie|énergétique|energie/.test(line)) {
      continue
    }

    const kjTail = referenceColumnTail(nutrientTailFromLine(rawLine))
    const kjMatch = kjTail.match(/(\d+[,.]?\d*)\s*kJ/i)
    if (kjMatch) {
      const kj = Number(kjMatch[1].replace(',', '.'))
      if (Number.isFinite(kj)) {
        return clampKcal(Math.round(kj / 4.184))
      }
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
    matches: [/^sel\b/, /\bsel\b/, /sodium/],
    extract: extractSaltFromLine,
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
      pattern: /\b(?:sel|sodium)\s*:\s*([^;\n]+)/i,
      extract: (match) => extractSaltFromTail(match[1]),
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

export function parseNutritionLabelFr(text: string): ParsedNutritionLabelResult {
  const normalized = normalizeOcrText(text)
  if (!normalized.trim()) {
    return {
      nutrients: emptyParsedLabel(),
      basis: '100g',
      confidence: 'low',
      warnings: [],
      fieldHints: {},
    }
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const tableLines = filterNutritionTableLines(lines)
  const tableText = tableLines.join('\n')

  const fromLines = scanLines(tableLines)
  const merged = {
    ...scanWholeText(tableText, fromLines),
    calories: extractCaloriesFromLabel(tableLines),
  }

  const validation = validateParsedNutrition(merged)

  return {
    nutrients: validation.nutrients,
    basis: detectReferenceBasis(normalized),
    confidence: validation.confidence,
    warnings: validation.warnings,
    fieldHints: validation.fieldHints,
  }
}

export function formatParsedNutrientForInput(value: number | null): string {
  if (value == null) {
    return ''
  }

  const truncated = Math.trunc(value * 10) / 10
  return Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(1)
}
