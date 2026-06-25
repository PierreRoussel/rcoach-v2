import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/design-system'
import { redirectIfAuthenticated } from '@/lib/auth/guards'
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const response = await nhost.auth.signUpEmailPassword({
        email,
        password,
        options: { displayName: displayName || email.split('@')[0] },
      })

      if (response.status !== 200) {
        setError("Impossible de créer le compte. L'email est peut-être déjà utilisé.")
        return
      }

      if (response.body.session != null) {
        await navigate({ to: '/app' })
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
    <AuthShell>
      <Card className="w-full rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-black">
            Rejoindre RCoach
          </CardTitle>
          <CardDescription>Créez votre compte athlète en quelques secondes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField>
              <Label htmlFor="displayName">Nom affiche</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Leo"
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
              />
            </FormField>
            <FormField>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </FormField>
            {error ? <FormMessage>{error}</FormMessage> : null}
            {success ? (
              <p className="text-sm text-foreground">{success}</p>
            ) : null}
            <Button
              className="w-full rounded-full"
              variant="pill"
              type="submit"
              disabled={isSubmitting || success != null}
            >
              {isSubmitting ? 'Création...' : "S'inscrire"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/auth/login">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
