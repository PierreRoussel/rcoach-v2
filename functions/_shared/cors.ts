type CorsFunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
}

type CorsFunctionResponse = {
  status: (code: number) => CorsFunctionResponse
  json: (body: unknown) => void
  set?: (header: string, value: string) => CorsFunctionResponse
  setHeader?: (header: string, value: string) => CorsFunctionResponse
  send?: (body?: string) => void
  end?: () => void
}

function readHeader(
  headers: CorsFunctionRequest['headers'],
  name: string,
): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function setResponseHeader(res: CorsFunctionResponse, name: string, value: string) {
  if (res.setHeader) {
    res.setHeader(name, value)
    return
  }

  res.set?.(name, value)
}

/** CORS for browser calls from the Vite app (Authorization + JSON preflight). */
export function applyFunctionCors(req: CorsFunctionRequest, res: CorsFunctionResponse) {
  const origin = readHeader(req.headers, 'origin')

  if (origin) {
    setResponseHeader(res, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(res, 'Vary', 'Origin')
  } else {
    setResponseHeader(res, 'Access-Control-Allow-Origin', '*')
  }

  setResponseHeader(res, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
  setResponseHeader(
    res,
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Accept, Origin',
  )
  setResponseHeader(res, 'Access-Control-Max-Age', '86400')
}

export function handleFunctionCorsPreflight(
  req: CorsFunctionRequest,
  res: CorsFunctionResponse,
): boolean {
  applyFunctionCors(req, res)

  if (req.method !== 'OPTIONS') {
    return false
  }

  if (res.end) {
    res.status(204).end()
    return true
  }

  res.status(204).send?.('')
  return true
}
