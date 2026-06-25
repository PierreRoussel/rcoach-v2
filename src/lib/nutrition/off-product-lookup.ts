import type { NhostClient } from '@nhost/nhost-js'

import { GET_FOOD_BY_BARCODE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  getOffProductByBarcode,
  mapFoodToOffDraft,
  type OffFoodDraft,
} from '@/lib/nutrition/open-food-facts'
import type { Food } from '@/lib/nutrition/types'

export async function resolveOffDraftFromBarcode(
  nhost: NhostClient | null | undefined,
  barcode: string,
): Promise<OffFoodDraft | null> {
  const normalized = barcode.trim()
  if (!normalized) {
    return null
  }

  if (nhost) {
    try {
      const data = await graphqlRequest<{ foods: Food[] }>(nhost, GET_FOOD_BY_BARCODE, {
        barcode: normalized,
      })

      const cachedFood = data.foods[0]
      if (cachedFood) {
        return mapFoodToOffDraft(cachedFood)
      }
    } catch {
      // Fall back to live OFF lookup.
    }
  }

  return getOffProductByBarcode(normalized)
}
