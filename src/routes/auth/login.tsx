import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { redirectIfAuthenticated, resolveDefaultAuthenticatedPath, ensureAuthenticatedProfile } from '@/lib/auth/guards'
import { mapAuthError } from '@/lib/auth/auth-errors'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/login')({
  beforeLoad: redirectIfAuthenticated,
  validateSearch: z.object({
    passwordUpdated: z.string().optional(),
    returnTo: z.string().optional(),
  }),
  component: LoginPage,
})

function LoginPage() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await nhost.auth.signInEmailPassword({ email, password })

      if (response.status !== 200 || response.body.session == null) {
        setError(
          mapAuthError(
            response.body,
            'Email ou mot de passe incorrect.',
          ),
        )
        return
      }

      await ensureAuthenticatedProfile()
      const destination =
        search.returnTo?.startsWith('/') && !search.returnTo.startsWith('//')
          ? search.returnTo
          : await resolveDefaultAuthenticatedPath()
      await navigate({ to: destination })
    } catch (error) {
      setError(mapAuthError(error, 'Connexion impossible. Vérifiez vos identifiants.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthMobileShell
      variant="login"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Pas de compte ?{' '}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to="/auth/register"
          >
            Créer un compte
          </Link>
        </p>
      }
    >
      <GoogleSignInButton />
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordField
            id="password"
            label=""
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            className="[&>label]:sr-only"
          />
        </div>

        {error ? <FormMessage>{error}</FormMessage> : null}
        {search.passwordUpdated ? (
          <p className="text-sm text-foreground">
            Mot de passe mis à jour. Reconnectez-vous avec votre nouveau mot de passe.
          </p>
        ) : null}

        <Button
          className="h-12 w-full rounded-full"
          variant="pill"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
    </AuthMobileShell>
  )
}
