import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordResetEmail } from '@/lib/auth/pkce-flow'
import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/forgot-password')({
  beforeLoad: redirectIfAuthenticated,
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { nhost } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    try {
      const response = await requestPasswordResetEmail(nhost, email)

      if (response.status !== 200) {
        setError("Impossible d'envoyer l'email de réinitialisation.")
        return
      }

      setInfo('Un email de réinitialisation a été envoyé si cette adresse existe.')
    } catch {
      setError("Impossible d'envoyer l'email de réinitialisation.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthMobileShell
      variant="recovery"
      title="Mot de passe oublié"
      description="Recevez un lien pour définir un nouveau mot de passe."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to="/auth/login"
          >
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12"
          />
        </FormField>
        {error ? <FormMessage>{error}</FormMessage> : null}
        {info ? <p className="text-sm text-foreground">{info}</p> : null}
        <Button
          className="h-12 w-full rounded-full"
          variant="pill"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
        </Button>
      </form>
    </AuthMobileShell>
  )
}
