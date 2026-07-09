import type { NhostClient } from '@nhost/nhost-js'

import { mapAuthError, type AuthErrorBody } from '@/lib/auth/auth-errors'

export function mapPasswordChangeError(error: unknown): string {
  return mapAuthError(error, 'Impossible de mettre à jour le mot de passe.')
}

export async function changeAuthenticatedUserPassword(
  nhost: NhostClient,
  params: {
    email: string
    currentPassword: string
    newPassword: string
  },
) {
  const verification = await nhost.auth.signInEmailPassword({
    email: params.email,
    password: params.currentPassword,
  })

  if (verification.status !== 200) {
    throw new Error('Mot de passe actuel incorrect.')
  }

  const response = await nhost.auth.changeUserPassword({
    newPassword: params.newPassword,
  })

  if (response.status !== 200) {
    throw {
      body: response.body as AuthErrorBody,
    }
  }

  return response
}
