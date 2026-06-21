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

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { nhost, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
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
      const response = await nhost.auth.signUpEmailPassword({
        email,
        password,
        options: { displayName: displayName || email.split('@')[0] },
      })

      if (response.status !== 200 || response.body.session == null) {
        setError("Impossible de creer le compte. L'email est peut-etre deja utilise.")
        return
      }

      await navigate({ to: '/app' })
    } catch {
      setError('Inscription impossible. Reessayez plus tard.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>RCoach</CardTitle>
          <CardDescription>Creez votre compte athlete</CardDescription>
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
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creation...' : "S'inscrire"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Deja un compte ?{' '}
            <Link className="text-foreground underline" to="/auth/login">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
