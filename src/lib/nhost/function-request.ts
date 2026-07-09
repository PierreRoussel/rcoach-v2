import { generateServiceUrl } from '@nhost/nhost-js'

/** Base functions URL — `generateServiceUrl` already ends with `/v1`. */
export function readNhostFunctionsBaseUrl(): string | null {
  const configured = import.meta.env.VITE_BILLING_FUNCTION_BASE?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN?.trim()
  const region = import.meta.env.VITE_NHOST_REGION?.trim()
  if (!subdomain || !region) {
    return null
  }

  return generateServiceUrl('functions', subdomain, region)
}

export function buildNhostFunctionUrl(functionName: string): string | null {
  const baseUrl = readNhostFunctionsBaseUrl()
  if (!baseUrl) {
    return null
  }

  const normalized = baseUrl.replace(/\/$/, '')
  if (normalized.endsWith('/v1')) {
    return `${normalized}/${functionName}`
  }

  return `${normalized}/v1/${functionName}`
}

export async function postNhostFunction<T>(
  accessToken: string,
  functionName: string,
  body?: unknown,
): Promise<T> {
  const url = buildNhostFunctionUrl(functionName)
  if (!url) {
    throw new Error('Configuration Nhost Functions indisponible.')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : `Erreur function ${functionName} (${response.status}).`
    throw new Error(message)
  }

  return payload as T
}
