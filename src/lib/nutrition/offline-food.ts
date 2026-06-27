import { db } from '@/lib/db/dexie'
import {
  buildFoodSearchHaystack,
  extractFoodSearchTokens,
  matchesAllFoodSearchTokens,
  normalizeFoodSearchQuery,
} from '@/lib/nutrition/food-search-tokens'
import type { Food } from '@/lib/nutrition/types'

export function createLocalFoodId() {
  return crypto.randomUUID()
}

export function isLocalFoodId(id: string) {
  return id.startsWith('local:')
}

export function toLocalFoodId(id: string) {
  return id.startsWith('local:') ? id : `local:${id}`
}

export function stripLocalFoodId(id: string) {
  return id.startsWith('local:') ? id.slice('local:'.length) : id
}

export async function cacheFood(food: Food) {
  await db.foodsCache.put(food)
}

export async function getCachedFood(id: string) {
  return db.foodsCache.get(id)
}

export async function searchCachedFoods(query: string, limit = 20) {
  const normalized = normalizeFoodSearchQuery(query)
  if (!normalized) {
    return []
  }

  const tokens = extractFoodSearchTokens(query)
  const foods = await db.foodsCache.toArray()

  return foods
    .filter((food) => {
      const haystack = buildFoodSearchHaystack(food.name, food.brand, food.barcode)
      if (tokens.length >= 2) {
        return matchesAllFoodSearchTokens(haystack, tokens)
      }

      return haystack.includes(normalized)
    })
    .slice(0, limit)
}

export function buildLocalFood(
  object: Record<string, unknown>,
  userId: string,
  localId = createLocalFoodId(),
): Food {
  const now = new Date().toISOString()

  return {
    id: toLocalFoodId(localId),
    user_id:
      object.source === 'open_food_facts' || object.source === 'ciqual' ? null : userId,
    barcode: (object.barcode as string | null) ?? null,
    name: String(object.name ?? ''),
    brand: (object.brand as string | null) ?? null,
    calories: Number(object.calories ?? 0),
    carbs_g: Number(object.carbs_g ?? 0),
    protein_g: Number(object.protein_g ?? 0),
    fat_g: Number(object.fat_g ?? 0),
    salt_g: (object.salt_g as number | null) ?? null,
    sugar_g: (object.sugar_g as number | null) ?? null,
    saturated_fat_g: (object.saturated_fat_g as number | null) ?? null,
    serving_size_g: Number(object.serving_size_g ?? 100),
    serving_label: String(object.serving_label ?? '100 g'),
    source:
      object.source === 'open_food_facts'
        ? 'open_food_facts'
        : object.source === 'ciqual'
          ? 'ciqual'
          : 'user',
    off_product_id: (object.off_product_id as string | null) ?? null,
    ciqual_code: (object.ciqual_code as string | null) ?? null,
    created_at: now,
    updated_at: now,
  }
}
