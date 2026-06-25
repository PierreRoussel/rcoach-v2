import { Capacitor } from '@capacitor/core'

import type { Food } from '@/lib/nutrition/types'

const OFF_DIRECT_API = 'https://world.openfoodfacts.org'
const OFF_SEARCH_DIRECT_API = 'https://search.openfoodfacts.org'
const OFF_PROXY_PATH = '/api/open-food-facts'
const OFF_SEARCH_PROXY_PATH = '/api/open-food-facts-search'
const OFF_USER_AGENT = 'RCoach/0.1 (contact: app@rcoach.local)'

export const OFF_MIN_QUERY_LENGTH = 4
export const OFF_PRODUCT_FIELDS =
  'code,product_name,brands,nutriments,serving_size,serving_quantity'

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504])
const MAX_FETCH_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500

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

type OffV3ProductResponse = {
  code?: string
  product?: OffSearchProduct
  errors?: unknown[]
}

type OffSearchALiciousResponse = {
  hits?: OffSearchProduct[]
  errors?: unknown[]
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function usesPathQueryProxy(base: string) {
  return base.includes('.functions.') && base.includes('.nhost.run/v1/open-food-facts')
}

function resolveNhostFunctionBase() {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN?.trim()
  const region = import.meta.env.VITE_NHOST_REGION?.trim()
  if (!subdomain || !region || subdomain === 'local') {
    return null
  }

  return `https://${subdomain}.functions.${region}.nhost.run/v1/open-food-facts`
}

export function getOffApiBaseUrl(): string {
  const configured = import.meta.env.VITE_OFF_API_BASE?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const nhostFunctionBase = resolveNhostFunctionBase()
  if (nhostFunctionBase && Capacitor.isNativePlatform()) {
    return nhostFunctionBase
  }

  if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
    return OFF_PROXY_PATH
  }

  return OFF_DIRECT_API
}

export function getOffSearchApiBaseUrl(): string {
  const configured = import.meta.env.VITE_OFF_SEARCH_API_BASE?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const productBase = getOffApiBaseUrl()
  if (usesPathQueryProxy(productBase)) {
    return productBase
  }

  if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
    return OFF_SEARCH_PROXY_PATH
  }

  return OFF_SEARCH_DIRECT_API
}

function buildProxyUrl(base: string, path: string): string {
  if (usesPathQueryProxy(base)) {
    return `${base}?path=${encodeURIComponent(path)}`
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

function buildOffUrl(path: string): string {
  return buildProxyUrl(getOffApiBaseUrl(), path)
}

function buildSearchUrl(path: string): string {
  return buildProxyUrl(getOffSearchApiBaseUrl(), path)
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': OFF_USER_AGENT,
      },
    })

    if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_FETCH_RETRIES - 1) {
      return response
    }

    lastResponse = response
    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
  }

  return lastResponse!
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

export function mapFoodToOffDraft(food: Food): OffFoodDraft | null {
  const offProductId = food.off_product_id ?? food.barcode
  if (!offProductId) {
    return null
  }

  return {
    barcode: food.barcode ?? offProductId,
    offProductId,
    name: food.name,
    brand: food.brand,
    calories: Number(food.calories),
    carbsG: Number(food.carbs_g),
    proteinG: Number(food.protein_g),
    fatG: Number(food.fat_g),
    saltG: food.salt_g != null ? Number(food.salt_g) : null,
    sugarG: food.sugar_g != null ? Number(food.sugar_g) : null,
    saturatedFatG: food.saturated_fat_g != null ? Number(food.saturated_fat_g) : null,
    servingSizeG: Number(food.serving_size_g),
    servingLabel: food.serving_label,
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

function mapOffProducts(products: OffSearchProduct[]) {
  return products
    .map((product) => mapOffProductToDraft(product))
    .filter((item): item is OffFoodDraft => item != null)
}

async function searchOffProductsLegacy(query: string, pageSize: number): Promise<OffFoodDraft[]> {
  const params = new URLSearchParams({
    search_terms: query.trim(),
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    fields: OFF_PRODUCT_FIELDS,
    lc: 'fr',
  })

  const response = await fetchWithRetry(buildOffUrl(`/cgi/search.pl?${params.toString()}`))
  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as { products?: OffSearchProduct[] }
  return mapOffProducts(data.products ?? [])
}

async function searchOffProductsSearchALicious(
  query: string,
  pageSize: number,
): Promise<OffFoodDraft[]> {
  const params = new URLSearchParams({
    q: query.trim(),
    page_size: String(pageSize),
    langs: 'fr,en',
    fields: OFF_PRODUCT_FIELDS,
  })

  const response = await fetchWithRetry(buildSearchUrl(`/search?${params.toString()}`))
  if (!response.ok) {
    throw new Error(`Search-a-licious responded with ${response.status}`)
  }

  const data = (await response.json()) as OffSearchALiciousResponse
  if (data.errors?.length) {
    throw new Error('Search-a-licious returned errors')
  }

  return mapOffProducts(data.hits ?? [])
}

export async function searchOffProducts(query: string, pageSize = 20): Promise<OffFoodDraft[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  try {
    return await searchOffProductsSearchALicious(trimmed, pageSize)
  } catch {
    return searchOffProductsLegacy(trimmed, pageSize)
  }
}

export async function getOffProductByBarcode(barcode: string): Promise<OffFoodDraft | null> {
  const normalized = barcode.trim()
  if (!normalized) {
    return null
  }

  try {
    const params = new URLSearchParams({ fields: OFF_PRODUCT_FIELDS })
    const response = await fetchWithRetry(
      buildOffUrl(
        `/api/v3/product/${encodeURIComponent(normalized)}.json?${params.toString()}`,
      ),
    )
    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as OffV3ProductResponse
    if (!data.product?.product_name?.trim()) {
      return null
    }

    return mapOffProductToDraft({
      ...data.product,
      code: data.code ?? normalized,
    })
  } catch {
    return null
  }
}

export function isOffCachedFood(food: Pick<Food, 'source' | 'off_product_id'>) {
  return food.source === 'open_food_facts' && Boolean(food.off_product_id)
}

export {
  OFF_DIRECT_API,
  OFF_PROXY_PATH,
  OFF_SEARCH_DIRECT_API,
  OFF_SEARCH_PROXY_PATH,
  OFF_USER_AGENT,
}
