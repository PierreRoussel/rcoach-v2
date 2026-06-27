import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { PasswordRequirementsList } from '@/components/auth/PasswordRequirementsList'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  buildEmailVerificationRedirectUrl,
  storePkceChallenge,
} from '@/lib/auth/pkce-flow'
import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { validateNewPassword } from '@/lib/auth/password-policy'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/register')({
  beforeLoad: redirectIfAuthenticated,
  component: RegisterPage,
})

function RegisterPage() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = useMemo(() => validateNewPassword(password), [password])
  const canSubmit = validation.isValid && !isSubmitting && success == null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validation.isValid) {
      setError('Le mot de passe ne respecte pas les critères requis.')
      return
    }

    setIsSubmitting(true)

    try {
      const codeChallenge = await storePkceChallenge()
      const response = await nhost.auth.signUpEmailPassword({
        email,
        password,
        codeChallenge,
        options: {
          displayName: displayName || email.split('@')[0],
          redirectTo: buildEmailVerificationRedirectUrl('signup'),
        },
      })

      if (response.status !== 200) {
        setError("Impossible de créer le compte. L'email est peut-être déjà utilisé.")
        return
      }

      if (response.body.session != null) {
        await navigate({ to: '/app/onboarding' })
        return
      }

      setSuccess('Compte créé — vérifiez votre email pour confirmer.')
    } catch {
      setError('Inscription impossible. Réessayez plus tard.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthMobileShell
      variant="register"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to="/auth/login"
          >
            Se connecter
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField>
          <Label htmlFor="displayName">Nom affiché</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Leo"
            className="h-12"
          />
        </FormField>
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
        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
        />
        {password ? <PasswordRequirementsList validation={validation} password={password} /> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}
        {success ? <p className="text-sm text-foreground">{success}</p> : null}
        <Button
          className="h-12 w-full rounded-full"
          variant="pill"
          type="submit"
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Création...' : "S'inscrire"}
        </Button>
      </form>
    </AuthMobileShell>
  )
}
