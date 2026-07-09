export type AuthErrorBody = {
  message?: string
  error?: string
}

function readAuthErrorBody(error: unknown): AuthErrorBody | null {
  if (error && typeof error === 'object') {
    if ('body' in error) {
      const body = (error as { body?: AuthErrorBody }).body
      if (body?.error || body?.message) {
        return body
      }
    }

    if ('error' in error || 'message' in error) {
      const direct = error as AuthErrorBody
      if (direct.error || direct.message) {
        return direct
      }
    }
  }

  return null
}

export function mapAuthError(error: unknown, fallback: string): string {
  const body = readAuthErrorBody(error)

  if (body?.error) {
    switch (body.error) {
      case 'disabled-user':
        return 'Ce compte est désactivé. Réactivez-le dans Nhost (Auth → Users) ou utilisez un autre email.'
      case 'email-already-in-use':
      case 'user-already-exists':
        return 'Cet email est déjà enregistré. Connectez-vous, réinitialisez votre mot de passe, ou demandez la suppression complète du compte (Auth → Users ou purge SQL admin).'
      case 'invalid-email-password':
        return 'Email ou mot de passe incorrect.'
      case 'email-not-verified':
        return 'Confirmez votre email avant de vous connecter.'
      case 'password-too-short':
        return 'Le mot de passe est trop court.'
      case 'password-in-hibp-database':
        return 'Ce mot de passe est trop courant. Choisissez-en un plus unique.'
      default:
        break
    }
  }

  const message = body?.message?.toLowerCase() ?? ''
  if (message.includes('disabled')) {
    return 'Ce compte est désactivé. Réactivez-le dans Nhost (Auth → Users) ou utilisez un autre email.'
  }

  if (body?.message) {
    return body.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
