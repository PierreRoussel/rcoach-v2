import { getCachedBarcode, setCachedBarcode } from './_off/cache'
import { fetchWithRetry } from './_off/fetch'

const OFF_USER_AGENT = 'RCoach/0.1 (contact: app@rcoach.local)'
const OFF_BASE = 'https://world.openfoodfacts.org'
const SEARCH_BASE = 'https://search.openfoodfacts.org'
const BARCODE_PATH = /^\/api\/v3\/product\/([^/?]+)\.json/

type ProxyRequest = {
  method: string
  query: Record<string, unknown>
}

type ProxyResponse = {
  status: (code: number) => ProxyResponse
  set: (header: string, value: string) => ProxyResponse
  send: (body: string) => void
  json: (body: unknown) => void
}

function resolveUpstreamBase(path: string) {
  if (path === '/search' || path.startsWith('/search?')) {
    return SEARCH_BASE
  }

  return OFF_BASE
}

export default async (req: ProxyRequest, res: ProxyResponse) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const rawPath = typeof req.query.path === 'string' ? req.query.path : ''
  if (!rawPath.startsWith('/')) {
    res.status(400).json({ error: 'Missing or invalid path query parameter.' })
    return
  }

  const barcodeMatch = rawPath.match(BARCODE_PATH)
  if (barcodeMatch) {
    const cached = getCachedBarcode(barcodeMatch[1])
    if (cached) {
      res.status(cached.status).set('Content-Type', cached.contentType).send(cached.body)
      return
    }
  }

  const upstreamBase = resolveUpstreamBase(rawPath)
  const upstreamUrl = `${upstreamBase}${rawPath}`

  try {
    const upstream = await fetchWithRetry(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': OFF_USER_AGENT,
      },
    })

    const body = await upstream.text()
    const contentType = upstream.headers.get('content-type') ?? 'application/json'

    if (barcodeMatch && upstream.ok) {
      setCachedBarcode(barcodeMatch[1], {
        body,
        status: upstream.status,
        contentType,
      })
    }

    res.status(upstream.status).set('Content-Type', contentType).send(body)
  } catch {
    res.status(502).json({ error: 'Open Food Facts proxy failed.' })
  }
}
