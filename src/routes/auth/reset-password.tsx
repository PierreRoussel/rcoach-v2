import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { AuthMobileShell } from '@/components/auth/AuthMobileShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { PasswordRequirementsList } from '@/components/auth/PasswordRequirementsList'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form'
import { mapPasswordChangeError } from '@/lib/auth/change-password'
import { validateNewPassword } from '@/lib/auth/password-policy'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { nhost, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = useMemo(() => validateNewPassword(password), [password])
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const canSubmit = validation.isValid && passwordsMatch && !isSubmitting

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!validation.isValid) {
      setError('Le mot de passe ne respecte pas les critères requis.')
      return
    }

    if (!passwordsMatch) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await nhost.auth.changeUserPassword({ newPassword: password })

      if (response.status !== 200) {
        throw { body: response.body }
      }

      await navigate({
        to: '/auth/login',
        search: { passwordUpdated: '1' },
      })
    } catch (submitError) {
      setError(mapPasswordChangeError(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AuthMobileShell
        variant="recovery"
        title="Chargement..."
        description="Préparation de la réinitialisation."
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthMobileShell
        variant="recovery"
        title="Lien expiré"
        description="Demandez un nouveau lien de réinitialisation."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              to="/auth/forgot-password"
            >
              Mot de passe oublié
            </Link>
          </p>
        }
      />
    )
  }

  return (
    <AuthMobileShell
      variant="recovery"
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé pour votre compte."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          id="newPassword"
          label="Nouveau mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        {password ? <PasswordRequirementsList validation={validation} password={password} /> : null}
        <PasswordField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          required
        />
        {confirmPassword && !passwordsMatch ? (
          <FormMessage>La confirmation ne correspond pas.</FormMessage>
        ) : null}
        {error ? <FormMessage>{error}</FormMessage> : null}
        <Button
          className="h-12 w-full rounded-full"
          variant="pill"
          type="submit"
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
        </Button>
      </form>
    </AuthMobileShell>
  )
}
