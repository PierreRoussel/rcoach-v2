import {
  FOOD_DB_NUMERIC_MAX,
  MAX_KCAL_PER_100G,
  MAX_MACRO_PER_100G,
  normalizeOptionalNutrient,
  normalizeRequiredPer100g,
} from './food-numeric-bounds.mjs'
import { CIQUAL_NUTRIENT_CODES } from './ciqual-xml.mjs'

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
  'ciqual_code',
  'user_id',
]

const CONFLICT_TARGET = `(ciqual_code) WHERE (source = 'ciqual' AND ciqual_code IS NOT NULL)`

export function mapCiqualFoodToRow(alim, nutrients) {
  if (!alim?.alimCode || !alim?.name || !nutrients) {
    return null
  }

  const calories = nutrients[CIQUAL_NUTRIENT_CODES.calories]
  const carbsG = nutrients[CIQUAL_NUTRIENT_CODES.carbs]
  const proteinG = nutrients[CIQUAL_NUTRIENT_CODES.protein]
  const fatG = nutrients[CIQUAL_NUTRIENT_CODES.fat]

  if (
    !normalizeRequiredPer100g(calories, MAX_KCAL_PER_100G) ||
    !normalizeRequiredPer100g(carbsG, MAX_MACRO_PER_100G) ||
    !normalizeRequiredPer100g(proteinG, MAX_MACRO_PER_100G) ||
    !normalizeRequiredPer100g(fatG, MAX_MACRO_PER_100G)
  ) {
    return null
  }

  return {
    barcode: null,
    name: alim.name,
    brand: null,
    calories,
    carbs_g: carbsG,
    protein_g: proteinG,
    fat_g: fatG,
    salt_g: normalizeOptionalNutrient(
      nutrients[CIQUAL_NUTRIENT_CODES.salt],
      FOOD_DB_NUMERIC_MAX,
    ),
    sugar_g: normalizeOptionalNutrient(
      nutrients[CIQUAL_NUTRIENT_CODES.sugar],
      FOOD_DB_NUMERIC_MAX,
    ),
    saturated_fat_g: normalizeOptionalNutrient(
      nutrients[CIQUAL_NUTRIENT_CODES.saturatedFat],
      FOOD_DB_NUMERIC_MAX,
    ),
    serving_size_g: 100,
    serving_label: '100 g',
    source: 'ciqual',
    off_product_id: null,
    ciqual_code: alim.alimCode,
    user_id: null,
  }
}

export function buildCiqualInsertQuery(rows, { upsert = false } = {}) {
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
