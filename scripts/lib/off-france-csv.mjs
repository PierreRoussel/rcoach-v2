import {
  isFranceProduct,
  isValidNutrientValue,
  normalizeBrand,
  normalizeOffCode,
  resolveOffProductName,
  shouldKeepFranceLiteProduct,
  toFranceLiteProduct,
} from './off-france-filter.mjs'

const MACRO_COLUMNS = [
  'energy-kcal_100g',
  'carbohydrates_100g',
  'proteins_100g',
  'fat_100g',
]

const NAME_COLUMN_CANDIDATES = [
  'product_name',
  'product_name_fr',
  'generic_name',
  'generic_name_fr',
]

const FIELD_ALIASES = {
  product_name: ['product_name', 'product_name_fr'],
  product_name_fr: ['product_name_fr', 'product_name'],
  generic_name: ['generic_name', 'generic_name_fr'],
  generic_name_fr: ['generic_name_fr', 'generic_name'],
  no_nutriments: ['no_nutriments', 'no_nutrition_data'],
}

export function parseTsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === '\t' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }

    current += char
  }

  fields.push(current)
  return fields
}

export function buildColumnIndexMap(headerFields) {
  const map = Object.create(null)

  for (let index = 0; index < headerFields.length; index += 1) {
    const name = headerFields[index]?.trim()
    if (name) {
      map[name] = index
    }
  }

  return map
}

function hasAnyColumn(columnMap, candidates) {
  return candidates.some((name) => columnMap[name] != null)
}

export function validateCsvHeader(headerFields) {
  const columnMap = buildColumnIndexMap(headerFields)
  const missingMacros = MACRO_COLUMNS.filter((name) => columnMap[name] == null)

  if (columnMap.code == null) {
    throw new Error('Colonne CSV manquante: code')
  }

  if (missingMacros.length > 0) {
    throw new Error(
      `Colonnes CSV manquantes: ${missingMacros.join(', ')}. Vérifiez le fichier export OFF.`,
    )
  }

  if (!hasAnyColumn(columnMap, NAME_COLUMN_CANDIDATES)) {
    throw new Error(
      'Aucune colonne de nom trouvée (product_name, product_name_fr, generic_name, generic_name_fr).',
    )
  }

  return columnMap
}

function readField(fields, columnMap, name) {
  const aliases = FIELD_ALIASES[name] ?? [name]

  for (const alias of aliases) {
    const index = columnMap[alias]
    if (index != null) {
      return fields[index]?.trim() ?? ''
    }
  }

  return ''
}

function parseNutrientField(raw) {
  if (!raw) {
    return null
  }

  const value = Number(raw.replace(',', '.'))
  return isValidNutrientValue(value) ? value : null
}

function parseCountriesTags(raw) {
  if (!raw) {
    return []
  }

  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function parseNoNutriments(raw) {
  if (!raw) {
    return false
  }

  const normalized = raw.trim().toLowerCase()
  return normalized === 'on' || normalized === '1' || normalized === 'true'
}

export function csvRowToRawProduct(fields, columnMap) {
  const nutriments = {
    'energy-kcal_100g': parseNutrientField(
      readField(fields, columnMap, 'energy-kcal_100g'),
    ),
    carbohydrates_100g: parseNutrientField(
      readField(fields, columnMap, 'carbohydrates_100g'),
    ),
    proteins_100g: parseNutrientField(readField(fields, columnMap, 'proteins_100g')),
    fat_100g: parseNutrientField(readField(fields, columnMap, 'fat_100g')),
    salt_100g: parseNutrientField(readField(fields, columnMap, 'salt_100g')),
    sugars_100g: parseNutrientField(readField(fields, columnMap, 'sugars_100g')),
    'saturated-fat_100g': parseNutrientField(
      readField(fields, columnMap, 'saturated-fat_100g'),
    ),
  }

  const servingQuantityRaw = readField(fields, columnMap, 'serving_quantity')
  const servingQuantity = servingQuantityRaw ? Number(servingQuantityRaw.replace(',', '.')) : null

  return {
    code: readField(fields, columnMap, 'code'),
    _id: readField(fields, columnMap, 'code'),
    product_name: readField(fields, columnMap, 'product_name'),
    product_name_fr: readField(fields, columnMap, 'product_name_fr'),
    generic_name: readField(fields, columnMap, 'generic_name'),
    generic_name_fr: readField(fields, columnMap, 'generic_name_fr'),
    brands: readField(fields, columnMap, 'brands'),
    countries: readField(fields, columnMap, 'countries'),
    countries_tags: parseCountriesTags(readField(fields, columnMap, 'countries_tags')),
    no_nutriments: parseNoNutriments(readField(fields, columnMap, 'no_nutriments')),
    nutriments,
    serving_size: readField(fields, columnMap, 'serving_size'),
    serving_quantity:
      servingQuantity != null && Number.isFinite(servingQuantity) ? servingQuantity : null,
  }
}

export function filterOffFranceCsvRow(fields, columnMap) {
  const product = csvRowToRawProduct(fields, columnMap)
  return toFranceLiteProduct(product)
}

export function mightMatchOffFranceCsvLine(line) {
  if (!line || line.startsWith('code\t')) {
    return false
  }

  return (
    line.includes('en:france') ||
    line.includes('fr:france') ||
    /(?:^|\t)France(?:\t|,|$)/.test(line) ||
    line.includes(',France,') ||
    line.endsWith(',France') ||
    line.includes('France,')
  )
}

export {
  isFranceProduct,
  normalizeBrand,
  normalizeOffCode,
  resolveOffProductName,
  shouldKeepFranceLiteProduct,
}
