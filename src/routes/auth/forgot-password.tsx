import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/ui/form'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordResetEmail } from '@/lib/auth/pkce-flow'
import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/forgot-password')({
  beforeLoad: redirectIfAuthenticated,
  component: ForgotPasswordPage,
})

const RESET_SUCCESS_MESSAGE =
  'Lien envoyé. Vérifiez votre boîte mail (et les spams) pour réinitialiser votre mot de passe.'

function ForgotPasswordPage() {
  const { nhost } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (isSubmitting || emailSent) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await requestPasswordResetEmail(nhost, email)

      if (response.status !== 200) {
        setError("Impossible d'envoyer l'email de réinitialisation.")
        return
      }

      setEmailSent(true)
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
            onChange={(event) => {
              setEmail(event.target.value)
              if (emailSent) {
                setEmailSent(false)
                setError(null)
              }
            }}
            required
            disabled={isSubmitting}
            className="h-12"
          />
        </FormField>
        {error ? <FormMessage>{error}</FormMessage> : null}
        {emailSent ? (
          <FeedbackMessage variant="success">{RESET_SUCCESS_MESSAGE}</FeedbackMessage>
        ) : null}
        <Button
          className="h-12 w-full rounded-full"
          variant="pill"
          type="submit"
          disabled={isSubmitting || emailSent}
        >
          {isSubmitting ? 'Envoi...' : emailSent ? 'Lien envoyé' : 'Envoyer le lien'}
        </Button>
        {emailSent ? (
          <p className="text-center text-xs text-muted-foreground">
            Vous pouvez modifier l’email ci-dessus pour renvoyer un lien à une autre adresse.
          </p>
        ) : null}
      </form>
    </AuthMobileShell>
  )
}
