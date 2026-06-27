import type { NhostClient } from '@nhost/nhost-js'

import { findFoodByBarcodeInDatabase } from '@/lib/nutrition/barcode-lookup'
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

  const cachedFood = await findFoodByBarcodeInDatabase(nhost, normalized)
  if (cachedFood) {
    return mapFoodToOffDraft(cachedFood)
  }

  return getOffProductByBarcode(normalized)
}
