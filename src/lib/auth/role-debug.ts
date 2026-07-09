import type { NhostClient } from '@nhost/nhost-js'

import { readSessionHasuraJwtClaims } from '@/lib/auth/hasura-jwt'
import type { ProfileRole } from '@/lib/graphql/operations'

/** Debug temporaire : rôle profil (GraphQL) vs claims JWT Hasura. */
export function logCurrentRoleDebug(
  nhost: NhostClient,
  profilesRole: ProfileRole | null | undefined,
  userId: string,
) {
  const jwtClaims = readSessionHasuraJwtClaims(nhost)

  console.log('[rcoach:role]', {
    profilesRole: {
      source: 'public.profiles.role (GraphQL GET_MY_PROFILE)',
      value: profilesRole ?? null,
      isAdmin: profilesRole === 'admin',
      userId,
    },
    hasuraJwt: {
      source: 'JWT access token (claims lus par Hasura côté SQL)',
      defaultRole: jwtClaims?.['x-hasura-default-role'] ?? null,
      role: jwtClaims?.['x-hasura-role'] ?? null,
      allowedRoles: jwtClaims?.['x-hasura-allowed-roles'] ?? null,
      userId: jwtClaims?.['x-hasura-user-id'] ?? null,
    },
  })
}
