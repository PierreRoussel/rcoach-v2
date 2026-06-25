import type { Food } from '@/lib/nutrition/types'

const OFF_API = 'https://world.openfoodfacts.org'

export type OffSearchProduct = {
  code: string
  product_name?: string
  brands?: string
  nutriments?: OffNutriments
  serving_size?: string
  serving_quantity?: number
}

type OffNutriments = {
  'energy-kcal_100g'?: number
  carbohydrates_100g?: number
  proteins_100g?: number
  fat_100g?: number
  salt_100g?: number
  sugars_100g?: number
  'saturated-fat_100g'?: number
}

export type OffFoodDraft = {
  barcode: string
  offProductId: string
  name: string
  brand: string | null
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  saltG: number | null
  sugarG: number | null
  saturatedFatG: number | null
  servingSizeG: number
  servingLabel: string
}

function parseOffNutriments(nutriments: OffNutriments | undefined) {
  return {
    calories: nutriments?.['energy-kcal_100g'] ?? 0,
    carbsG: nutriments?.carbohydrates_100g ?? 0,
    proteinG: nutriments?.proteins_100g ?? 0,
    fatG: nutriments?.fat_100g ?? 0,
    saltG: nutriments?.salt_100g ?? null,
    sugarG: nutriments?.sugars_100g ?? null,
    saturatedFatG: nutriments?.['saturated-fat_100g'] ?? null,
  }
}

export function mapOffProductToDraft(product: OffSearchProduct): OffFoodDraft | null {
  const name = product.product_name?.trim()
  if (!name) {
    return null
  }

  const nutrients = parseOffNutriments(product.nutriments)
  const servingSizeG = product.serving_quantity ?? 100
  const servingLabel = product.serving_size?.trim() || `${servingSizeG} g`

  return {
    barcode: product.code,
    offProductId: product.code,
    name,
    brand: product.brands?.split(',')[0]?.trim() ?? null,
    ...nutrients,
    servingSizeG,
    servingLabel,
  }
}

export function mapOffDraftToFoodInsert(draft: OffFoodDraft) {
  return {
    barcode: draft.barcode,
    name: draft.name,
    brand: draft.brand,
    calories: draft.calories,
    carbs_g: draft.carbsG,
    protein_g: draft.proteinG,
    fat_g: draft.fatG,
    salt_g: draft.saltG,
    sugar_g: draft.sugarG,
    saturated_fat_g: draft.saturatedFatG,
    serving_size_g: draft.servingSizeG,
    serving_label: draft.servingLabel,
    source: 'open_food_facts' as const,
    off_product_id: draft.offProductId,
    user_id: null,
  }
}

export async function searchOffProducts(query: string, pageSize = 20): Promise<OffFoodDraft[]> {
  if (!query.trim()) {
    return []
  }

  const params = new URLSearchParams({
    search_terms: query.trim(),
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    fields: 'code,product_name,brands,nutriments,serving_size,serving_quantity',
  })

  const response = await fetch(`${OFF_API}/cgi/search.pl?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Recherche Open Food Facts indisponible')
  }

  const data = (await response.json()) as { products?: OffSearchProduct[] }
  return (data.products ?? [])
    .map(mapOffProductToDraft)
    .filter((item): item is OffFoodDraft => item != null)
}

export async function getOffProductByBarcode(barcode: string): Promise<OffFoodDraft | null> {
  const normalized = barcode.trim()
  if (!normalized) {
    return null
  }

  const response = await fetch(`${OFF_API}/api/v2/product/${encodeURIComponent(normalized)}.json`)
  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as { product?: OffSearchProduct; status?: number }
  if (data.status !== 1 || !data.product) {
    return null
  }

  return mapOffProductToDraft({ ...data.product, code: normalized })
}

export function isOffCachedFood(food: Pick<Food, 'source' | 'off_product_id'>) {
  return food.source === 'open_food_facts' && Boolean(food.off_product_id)
}
