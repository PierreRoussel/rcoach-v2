const FRANCE_COUNTRY_TAGS = new Set(['en:france', 'fr:france'])

const MACRO_NUTRIENT_KEYS = [
  'energy-kcal_100g',
  'carbohydrates_100g',
  'proteins_100g',
  'fat_100g',
]

export function isValidNutrientValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function resolveOffProductName(product) {
  const candidates = [
    product.product_name,
    product.product_name_fr,
    product.generic_name,
    product.generic_name_fr,
  ]

  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return null
}

export function isFranceProduct(product) {
  if (Array.isArray(product.countries_tags)) {
    return product.countries_tags.some((tag) => FRANCE_COUNTRY_TAGS.has(tag))
  }

  const countries = product.countries?.toLowerCase() ?? ''
  return countries.split(',').some((part) => part.trim() === 'france')
}

export function hasMacronutrients(nutriments) {
  if (!nutriments) {
    return false
  }

  return MACRO_NUTRIENT_KEYS.every((key) => isValidNutrientValue(nutriments[key]))
}

export function shouldKeepFranceLiteProduct(product) {
  if (product.no_nutriments === true || product.no_nutriments === 'true') {
    return false
  }

  if (!resolveOffProductName(product)) {
    return false
  }

  if (!isFranceProduct(product)) {
    return false
  }

  return hasMacronutrients(product.nutriments)
}

export function normalizeOffCode(product) {
  const raw = product.code ?? product._id
  if (raw == null) {
    return null
  }

  const normalized = String(raw).trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizeBrand(brands) {
  if (Array.isArray(brands)) {
    return brands[0]?.trim() ?? null
  }

  return brands?.split(',')[0]?.trim() ?? null
}

export function toFranceLiteProduct(product) {
  if (!shouldKeepFranceLiteProduct(product)) {
    return null
  }

  const code = normalizeOffCode(product)
  const productName = resolveOffProductName(product)
  const nutriments = product.nutriments

  if (!code || !productName || !nutriments) {
    return null
  }

  const servingQuantityRaw = product.serving_quantity
  const servingQuantity =
    typeof servingQuantityRaw === 'number' && Number.isFinite(servingQuantityRaw)
      ? servingQuantityRaw
      : typeof servingQuantityRaw === 'string' && servingQuantityRaw.trim()
        ? Number(servingQuantityRaw)
        : null

  return {
    code,
    product_name: productName,
    brands: normalizeBrand(product.brands),
    nutriments: {
      'energy-kcal_100g': nutriments['energy-kcal_100g'] ?? null,
      carbohydrates_100g: nutriments.carbohydrates_100g ?? null,
      proteins_100g: nutriments.proteins_100g ?? null,
      fat_100g: nutriments.fat_100g ?? null,
      salt_100g:
        nutriments.salt_100g != null && isValidNutrientValue(nutriments.salt_100g)
          ? nutriments.salt_100g
          : null,
      sugars_100g:
        nutriments.sugars_100g != null && isValidNutrientValue(nutriments.sugars_100g)
          ? nutriments.sugars_100g
          : null,
      'saturated-fat_100g':
        nutriments['saturated-fat_100g'] != null &&
        isValidNutrientValue(nutriments['saturated-fat_100g'])
          ? nutriments['saturated-fat_100g']
          : null,
    },
    serving_size: product.serving_size?.trim() || null,
    serving_quantity:
      servingQuantity != null && Number.isFinite(servingQuantity) ? servingQuantity : null,
  }
}

export function filterOffFranceLiteLine(line) {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }

  let product
  try {
    product = JSON.parse(trimmed)
  } catch {
    return null
  }

  return toFranceLiteProduct(product)
}

/** Conservative pre-filter: must never skip a line that would pass filterOffFranceLiteLine. */
export function mightMatchOffFranceLine(line) {
  if (line.includes('"no_nutriments":true') || line.includes('"no_nutriments":"true"')) {
    return false
  }

  const hasFranceTag = line.includes('en:france') || line.includes('fr:france')
  let hasFranceCountries = false
  const countriesIdx = line.indexOf('"countries"')
  if (countriesIdx !== -1) {
    const countriesSlice = line.slice(countriesIdx, countriesIdx + 256)
    hasFranceCountries =
      countriesSlice.includes('France') ||
      countriesSlice.includes('france')
  }

  if (!hasFranceTag && !hasFranceCountries) {
    return false
  }

  if (
    !line.includes('energy-kcal_100g') ||
    !line.includes('carbohydrates_100g') ||
    !line.includes('proteins_100g') ||
    !line.includes('fat_100g')
  ) {
    return false
  }

  if (!line.includes('product_name') && !line.includes('generic_name')) {
    return false
  }

  return true
}
