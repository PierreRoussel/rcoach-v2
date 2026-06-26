export const FOOD_DB_NUMERIC_MAX = 999_999.99
export const MAX_KCAL_PER_100G = 9_999
export const MAX_MACRO_PER_100G = 100
export const MAX_SERVING_SIZE_G = 50_000

export function isDbSafeNumeric(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= FOOD_DB_NUMERIC_MAX
}

export function normalizeRequiredPer100g(value, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
}

export function normalizeOptionalNutrient(value, max = MAX_MACRO_PER_100G) {
  if (!normalizeRequiredPer100g(value, max)) {
    return null
  }

  return value
}

export function normalizeServingSizeG(value) {
  if (!isDbSafeNumeric(value) || value <= 0 || value > MAX_SERVING_SIZE_G) {
    return 100
  }

  return value
}
