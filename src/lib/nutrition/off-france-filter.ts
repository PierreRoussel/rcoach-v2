const FRANCE_COUNTRY_TAGS = new Set(['en:france', 'fr:france'])

const MACRO_NUTRIENT_KEYS = [
  'energy-kcal_100g',
  'carbohydrates_100g',
  'proteins_100g',
  'fat_100g',
] as const

export type OffNutrimentsLite = Partial<
  Record<
    | 'energy-kcal_100g'
    | 'carbohydrates_100g'
    | 'proteins_100g'
    | 'fat_100g'
    | 'salt_100g'
    | 'sugars_100g'
    | 'saturated-fat_100g',
    number | null
  >
>

export type OffRawProduct = {
  code?: string | number
  _id?: string
  product_name?: string
  product_name_fr?: string
  generic_name?: string
  generic_name_fr?: string
  brands?: string | string[]
  countries?: string
  countries_tags?: string[]
  no_nutriments?: boolean | string
  nutriments?: OffNutrimentsLite & Record<string, unknown>
  serving_size?: string
  serving_quantity?: number | string
}

export type OffFranceLiteProduct = {
  code: string
  product_name: string
  brands: string | null
  nutriments: OffNutrimentsLite
  serving_size: string | null
  serving_quantity: number | null
}

export function isValidNutrientValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function resolveOffProductName(product: OffRawProduct): string | null {
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

export function isFranceProduct(product: OffRawProduct): boolean {
  if (Array.isArray(product.countries_tags)) {
    return product.countries_tags.some((tag) => FRANCE_COUNTRY_TAGS.has(tag))
  }

  const countries = product.countries?.toLowerCase() ?? ''
  return countries.split(',').some((part) => part.trim() === 'france')
}

export function hasMacronutrients(nutriments: OffRawProduct['nutriments']): boolean {
  if (!nutriments) {
    return false
  }

  return MACRO_NUTRIENT_KEYS.every((key) => isValidNutrientValue(nutriments[key]))
}

export function shouldKeepFranceLiteProduct(product: OffRawProduct): boolean {
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

export function normalizeOffCode(product: OffRawProduct): string | null {
  const raw = product.code ?? product._id
  if (raw == null) {
    return null
  }

  const normalized = String(raw).trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizeBrand(brands: OffRawProduct['brands']): string | null {
  if (Array.isArray(brands)) {
    return brands[0]?.trim() ?? null
  }

  return brands?.split(',')[0]?.trim() ?? null
}

export function toFranceLiteProduct(product: OffRawProduct): OffFranceLiteProduct | null {
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

export function filterOffFranceLiteLine(line: string): OffFranceLiteProduct | null {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }

  let product: OffRawProduct
  try {
    product = JSON.parse(trimmed) as OffRawProduct
  } catch {
    return null
  }

  return toFranceLiteProduct(product)
}
