import {
  FOOD_DB_NUMERIC_MAX,
  MAX_KCAL_PER_100G,
  MAX_MACRO_PER_100G,
  MAX_SERVING_SIZE_G,
  normalizeOptionalNutrient,
  normalizeRequiredPer100g,
  normalizeServingSizeG,
} from './food-numeric-bounds.mjs'

const FOOD_COLUMNS = [
  'barcode',
  'name',
  'brand',
  'calories',
  'carbs_g',
  'protein_g',
  'fat_g',
  'salt_g',
  'sugar_g',
  'saturated_fat_g',
  'serving_size_g',
  'serving_label',
  'source',
  'off_product_id',
  'user_id',
]

const CONFLICT_TARGET = `(off_product_id) WHERE (source = 'open_food_facts' AND off_product_id IS NOT NULL)`

export function mapLiteProductToFoodRow(lite) {
  const code = lite?.code != null ? String(lite.code).trim() : ''
  const name = lite?.product_name?.trim()
  const nutriments = lite?.nutriments

  if (!code || !name || !nutriments) {
    return null
  }

  const calories = nutriments['energy-kcal_100g']
  const carbsG = nutriments.carbohydrates_100g
  const proteinG = nutriments.proteins_100g
  const fatG = nutriments.fat_100g

  if (
    !normalizeRequiredPer100g(calories, MAX_KCAL_PER_100G) ||
    !normalizeRequiredPer100g(carbsG, MAX_MACRO_PER_100G) ||
    !normalizeRequiredPer100g(proteinG, MAX_MACRO_PER_100G) ||
    !normalizeRequiredPer100g(fatG, MAX_MACRO_PER_100G)
  ) {
    return null
  }

  const servingQuantityRaw = lite.serving_quantity
  const servingSizeG =
    typeof servingQuantityRaw === 'number' && Number.isFinite(servingQuantityRaw)
      ? normalizeServingSizeG(servingQuantityRaw)
      : 100
  const servingLabel = lite.serving_size?.trim() || `${servingSizeG} g`

  return {
    barcode: code,
    name,
    brand: lite.brands?.trim() || null,
    calories,
    carbs_g: carbsG,
    protein_g: proteinG,
    fat_g: fatG,
    salt_g: normalizeOptionalNutrient(nutriments.salt_100g, FOOD_DB_NUMERIC_MAX),
    sugar_g: normalizeOptionalNutrient(nutriments.sugars_100g, FOOD_DB_NUMERIC_MAX),
    saturated_fat_g: normalizeOptionalNutrient(
      nutriments['saturated-fat_100g'],
      FOOD_DB_NUMERIC_MAX,
    ),
    serving_size_g: servingSizeG,
    serving_label: servingLabel,
    source: 'open_food_facts',
    off_product_id: code,
    user_id: null,
  }
}

export function buildFoodInsertQuery(rows, { upsert = false } = {}) {
  if (rows.length === 0) {
    return null
  }

  const values = []
  const params = []
  let paramIndex = 1

  for (const row of rows) {
    const placeholders = FOOD_COLUMNS.map((column) => {
      params.push(row[column])
      return `$${paramIndex++}`
    })
    values.push(`(${placeholders.join(', ')})`)
  }

  const updateClause = upsert
    ? `ON CONFLICT ${CONFLICT_TARGET} DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  calories = EXCLUDED.calories,
  carbs_g = EXCLUDED.carbs_g,
  protein_g = EXCLUDED.protein_g,
  fat_g = EXCLUDED.fat_g,
  salt_g = EXCLUDED.salt_g,
  sugar_g = EXCLUDED.sugar_g,
  saturated_fat_g = EXCLUDED.saturated_fat_g,
  serving_size_g = EXCLUDED.serving_size_g,
  serving_label = EXCLUDED.serving_label,
  updated_at = now()`
    : `ON CONFLICT ${CONFLICT_TARGET} DO NOTHING`

  return {
    text: `INSERT INTO public.foods (${FOOD_COLUMNS.join(', ')})
VALUES ${values.join(',\n')}
${updateClause}`,
    values: params,
  }
}

export {
  FOOD_DB_NUMERIC_MAX,
  MAX_KCAL_PER_100G,
  MAX_MACRO_PER_100G,
  MAX_SERVING_SIZE_G,
}
