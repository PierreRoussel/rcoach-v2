import type { NhostClient } from '@nhost/nhost-js'

import { db } from '@/lib/db/dexie'
import { GET_FOOD_BY_BARCODE, GET_FOOD_BY_OFF_ID } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import type { Food } from '@/lib/nutrition/types'

export function normalizeBarcodeInput(barcode: string) {
  return barcode.trim().replace(/\D/g, '')
}

export function buildBarcodeLookupVariants(barcode: string) {
  const trimmed = barcode.trim()
  const normalized = normalizeBarcodeInput(barcode)
  if (!normalized) {
    return []
  }

  const variants = new Set<string>([normalized])
  if (trimmed !== normalized) {
    variants.add(trimmed)
  }

  if (normalized.length === 12) {
    variants.add(`0${normalized}`)
  }

  if (normalized.length === 13 && normalized.startsWith('0')) {
    variants.add(normalized.slice(1))
  }

  if (normalized.length === 13 && !normalized.startsWith('0')) {
    variants.add(`0${normalized}`)
  }

  if (normalized.length === 14 && normalized.startsWith('0')) {
    variants.add(normalized.slice(1))
  }

  return [...variants]
}

function matchesBarcodeVariant(food: Food, variant: string) {
  return food.barcode === variant || food.off_product_id === variant
}

async function findFoodByBarcodeVariantsInCache(variants: string[]) {
  const foods = await db.foodsCache.toArray()

  for (const variant of variants) {
    const match = foods.find((food) => matchesBarcodeVariant(food, variant))
    if (match) {
      return match
    }
  }

  return null
}

export async function findFoodByBarcodeInDatabase(
  nhost: NhostClient | null | undefined,
  barcode: string,
): Promise<Food | null> {
  const variants = buildBarcodeLookupVariants(barcode)
  if (variants.length === 0) {
    return null
  }

  if (nhost) {
    try {
      for (const variant of variants) {
        const data = await graphqlRequest<{ foods: Food[] }>(nhost, GET_FOOD_BY_BARCODE, {
          barcode: variant,
        })

        if (data.foods[0]) {
          return data.foods[0]
        }
      }

      for (const variant of variants) {
        const data = await graphqlRequest<{ foods: Food[] }>(nhost, GET_FOOD_BY_OFF_ID, {
          offProductId: variant,
        })

        if (data.foods[0]) {
          return data.foods[0]
        }
      }
    } catch {
      // Fall back to Dexie cache below.
    }
  }

  return findFoodByBarcodeVariantsInCache(variants)
}
