import type { NhostClient } from '@nhost/nhost-js'

import { postNhostFunction } from '@/lib/nhost/function-request'

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
  const payload = await postNhostFunction<{ value: T }>(
    readAccessToken(nhost),
    'admin-kpi',
    body,
  )

  if (!payload || typeof payload !== 'object' || !('value' in payload)) {
    throw new Error('Réponse dashboard admin invalide.')
  }

  return payload.value
}
