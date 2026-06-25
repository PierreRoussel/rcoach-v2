import { Capacitor } from '@capacitor/core'

import type { Food } from '@/lib/nutrition/types'

const OFF_DIRECT_API = 'https://world.openfoodfacts.org'
const OFF_PROXY_PATH = '/api/open-food-facts'
const OFF_USER_AGENT = 'RCoach/0.1 (contact: app@rcoach.local)'

export type OffSearchProduct = {
  code: string
  product_name?: string
  brands?: string | string[]
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

export function getOffApiBaseUrl(): string {
  const configured = import.meta.env.VITE_OFF_API_BASE?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
    return OFF_PROXY_PATH
  }

  return OFF_DIRECT_API
}

function buildOffUrl(path: string): string {
  const base = getOffApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

async function fetchOff(path: string): Promise<Response> {
  return fetch(buildOffUrl(path), {
    headers: {
      Accept: 'application/json',
    },
  })
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

function normalizeBrand(brands: OffSearchProduct['brands']): string | null {
  if (Array.isArray(brands)) {
    return brands[0]?.trim() ?? null
  }

  return brands?.split(',')[0]?.trim() ?? null
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
    brand: normalizeBrand(product.brands),
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

  try {
    const response = await fetchOff(`/cgi/search.pl?${params.toString()}`)
    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as { products?: OffSearchProduct[] }
    return (data.products ?? [])
      .map(mapOffProductToDraft)
      .filter((item): item is OffFoodDraft => item != null)
  } catch {
    return []
  }
}

export async function getOffProductByBarcode(barcode: string): Promise<OffFoodDraft | null> {
  const normalized = barcode.trim()
  if (!normalized) {
    return null
  }

  try {
    const response = await fetchOff(
      `/api/v2/product/${encodeURIComponent(normalized)}.json`,
    )
    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { product?: OffSearchProduct; status?: number }
    if (data.status !== 1 || !data.product) {
      return null
    }

    return mapOffProductToDraft({ ...data.product, code: normalized })
  } catch {
    return null
  }
}

export function isOffCachedFood(food: Pick<Food, 'source' | 'off_product_id'>) {
  return food.source === 'open_food_facts' && Boolean(food.off_product_id)
}

export { OFF_DIRECT_API, OFF_PROXY_PATH, OFF_USER_AGENT }
