type CacheEntry = {
  body: string
  status: number
  contentType: string
  expiresAt: number
}

const BARCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 500

const barcodeCache = new Map<string, CacheEntry>()

export function getCachedBarcode(barcode: string): CacheEntry | null {
  const entry = barcodeCache.get(barcode)
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    barcodeCache.delete(barcode)
    return null
  }

  return entry
}

export function setCachedBarcode(
  barcode: string,
  entry: Pick<CacheEntry, 'body' | 'status' | 'contentType'>,
) {
  if (barcodeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = barcodeCache.keys().next().value
    if (oldestKey) {
      barcodeCache.delete(oldestKey)
    }
  }

  barcodeCache.set(barcode, {
    ...entry,
    expiresAt: Date.now() + BARCODE_CACHE_TTL_MS,
  })
}
