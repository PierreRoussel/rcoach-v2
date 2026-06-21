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
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const { nhost, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    void navigate({ to: '/app' })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await nhost.auth.signInEmailPassword({ email, password })

      if (response.status !== 200 || response.body.session == null) {
        setError('Email ou mot de passe incorrect.')
        return
      }

      await navigate({ to: '/app' })
    } catch {
      setError('Connexion impossible. Verifiez vos identifiants.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>RCoach</CardTitle>
          <CardDescription>Connectez-vous a votre compte</CardDescription>
        </CardHeader>
        <CardContent>
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
              />
            </FormField>
            <FormField>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </FormField>
            {error ? <FormMessage>{error}</FormMessage> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Pas de compte ?{' '}
            <Link className="text-foreground underline" to="/auth/register">
              Creer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
