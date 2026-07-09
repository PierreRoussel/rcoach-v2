import type { NhostClient } from '@nhost/nhost-js'

export type HasuraJwtClaims = {
  'x-hasura-default-role'?: string
  'x-hasura-role'?: string
  'x-hasura-allowed-roles'?: string[]
  'x-hasura-user-id'?: string
}

export function readHasuraJwtClaims(accessToken: string | null | undefined): HasuraJwtClaims | null {
  if (!accessToken) {
    return null
  }

  try {
    const payload = accessToken.split('.')[1]
    if (!payload) {
      return null
    }

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as Record<string, unknown>

    const nested = decoded['https://hasura.io/jwt/claims']
    if (nested && typeof nested === 'object') {
      return nested as HasuraJwtClaims
    }

    return decoded as HasuraJwtClaims
  } catch {
    return null
  }
}

export function readSessionHasuraJwtClaims(nhost: NhostClient): HasuraJwtClaims | null {
  return readHasuraJwtClaims(nhost.getUserSession()?.accessToken)
}

export function hasHasuraAllowedRole(nhost: NhostClient, role: string): boolean {
  const claims = readSessionHasuraJwtClaims(nhost)
  const allowed = claims?.['x-hasura-allowed-roles']

  if (Array.isArray(allowed)) {
    return allowed.includes(role)
  }

  return claims?.['x-hasura-default-role'] === role
}
