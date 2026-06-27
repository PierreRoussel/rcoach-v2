import type { NhostClient } from '@nhost/nhost-js'

type AuthErrorBody = {
  message?: string
  error?: string
}

export function mapPasswordChangeError(error: unknown): string {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: AuthErrorBody }).body

    switch (body?.error) {
      case 'password-too-short':
        return 'Le mot de passe est trop court.'
      case 'password-in-hibp-database':
        return 'Ce mot de passe est trop courant. Choisissez-en un plus unique.'
      case 'invalid-email-password':
        return 'Mot de passe actuel incorrect.'
      default:
        if (body?.message) {
          return body.message
        }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Impossible de mettre à jour le mot de passe.'
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
