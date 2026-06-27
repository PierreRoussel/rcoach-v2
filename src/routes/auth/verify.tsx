import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { exchangeAuthCode } from '@/lib/auth/pkce-flow'
import { syncOAuthProfile } from '@/lib/auth/sync-oauth-profile'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/verify')({
  validateSearch: z.object({
    code: z.string().optional(),
    flow: z.enum(['signup', 'reset']).optional(),
    error: z.string().optional(),
    errorDescription: z.string().optional(),
  }),
  component: VerifyPage,
})

function VerifyPage() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const oauthError = search.error
    if (oauthError) {
      setStatus('error')
      setError(search.errorDescription ?? 'La connexion Google a échoué.')
      return
    }

    const code = search.code

    if (!code) {
      setStatus('error')
      setError('Lien de vérification invalide.')
      return
    }

    async function verify() {
      if (!code) {
        return
      }

      try {
        const session = await exchangeAuthCode(nhost, code)
        const userId = session.user?.id

        if (userId) {
          await ensureUserProfile(nhost, userId)
          if (session.user) {
            await syncOAuthProfile(nhost, session.user)
          }
        }

        if (search.flow === 'reset') {
          await navigate({ to: '/auth/reset-password' })
          return
        }

        await navigate({ to: '/app/onboarding' })
      } catch (verifyError) {
        setStatus('error')
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : 'La vérification a échoué.',
        )
      }
    }

    void verify()
  }, [nhost, navigate, search.code, search.error, search.errorDescription, search.flow])

  return (
    <AuthMobileShell
      variant="recovery"
      title={status === 'verifying' ? 'Vérification...' : 'Échec de vérification'}
      description={
        status === 'verifying'
          ? 'Nous validons votre lien, un instant.'
          : (error ?? 'Le lien est peut-être expiré.')
      }
    >
      <div />
    </AuthMobileShell>
  )
}
