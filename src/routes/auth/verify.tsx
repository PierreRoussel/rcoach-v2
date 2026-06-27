import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { exchangeAuthCode } from '@/lib/auth/pkce-flow'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/verify')({
  validateSearch: z.object({
    code: z.string().optional(),
    flow: z.enum(['signup', 'reset']).optional(),
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
    const code = search.code

    if (!code) {
      setStatus('error')
      setError('Lien de vérification invalide.')
      return
    }

    async function verify() {
      try {
        await exchangeAuthCode(nhost, code)

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
  }, [nhost, navigate, search.code, search.flow])

  return (
    <AuthMobileShell
      title={status === 'verifying' ? 'Vérification...' : 'Échec de vérification'}
      description={
        status === 'verifying'
          ? 'Nous validons votre lien, un instant.'
          : (error ?? 'Le lien est peut-être expiré.')
      }
    />
  )
}
