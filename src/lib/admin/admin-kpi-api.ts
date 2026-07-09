import { generateServiceUrl } from '@nhost/nhost-js'

import type { NhostClient } from '@nhost/nhost-js'

function readFunctionsBaseUrl(): string | null {
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

function readAccessToken(nhost: NhostClient): string {
  const token = nhost.getUserSession()?.accessToken
  if (!token) {
    throw new Error('Session expirée.')
  }

  return token
}

export async function requestAdminKpi<T>(
  nhost: NhostClient,
  body: Record<string, unknown>,
): Promise<T> {
  const baseUrl = readFunctionsBaseUrl()
  if (!baseUrl) {
    throw new Error('Configuration Nhost Functions indisponible.')
  }

  const response = await fetch(`${baseUrl}/v1/admin-kpi`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${readAccessToken(nhost)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; value?: T }
    | null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && payload.error
        ? payload.error
        : `Erreur dashboard admin (${response.status}).`
    throw new Error(message)
  }

  if (!payload || typeof payload !== 'object' || !('value' in payload)) {
    throw new Error('Réponse dashboard admin invalide.')
  }

  return payload.value as T
}
