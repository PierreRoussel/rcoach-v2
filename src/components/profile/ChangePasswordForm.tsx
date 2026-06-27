import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  changeAuthenticatedUserPassword,
  mapPasswordChangeError,
} from '@/lib/auth/change-password'
import {
  PASSWORD_REQUIREMENTS,
  passwordIssueLabel,
  validateNewPassword,
} from '@/lib/auth/password-policy'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { cn } from '@/lib/utils'

type ChangePasswordFormProps = {
  email: string
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-full"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  )
}

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const validation = useMemo(
    () => validateNewPassword(newPassword, currentPassword),
    [newPassword, currentPassword],
  )

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit =
    currentPassword.length > 0 &&
    validation.isValid &&
    passwordsMatch &&
    !isSubmitting

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (!validation.isValid) {
      setError('Le nouveau mot de passe ne respecte pas les critères requis.')
      return
    }

    if (!passwordsMatch) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    setIsSubmitting(true)

    try {
      await changeAuthenticatedUserPassword(nhost, {
        email,
        currentPassword,
        newPassword,
      })

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

  async function handleSendResetEmail() {
    setError(null)
    setInfo(null)
    setIsSendingReset(true)

    try {
      const response = await nhost.auth.sendPasswordResetEmail({
        email,
        options: {
          redirectTo: `${window.location.origin}/auth/login`,
        },
      })

      if (response.status !== 200) {
        setError("Impossible d'envoyer l'email de réinitialisation.")
        return
      }

      setInfo('Un email de réinitialisation a été envoyé si cette adresse existe.')
    } catch {
      setError("Impossible d'envoyer l'email de réinitialisation.")
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="accountEmail">Email du compte</Label>
        <Input id="accountEmail" type="email" value={email} readOnly disabled />
      </div>

      <PasswordField
        id="currentPassword"
        label="Mot de passe actuel"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />

      <PasswordField
        id="newPassword"
        label="Nouveau mot de passe"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />

      <ul className="space-y-1 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const met = !validation.issues.includes(requirement)

          return (
            <li
              key={requirement}
              className={cn(
                'flex items-center gap-2',
                met ? 'text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              <Check className={cn('size-3.5 shrink-0', met ? 'opacity-100' : 'opacity-30')} />
              {passwordIssueLabel(requirement)}
            </li>
          )
        })}
        <li
          className={cn(
            'flex items-center gap-2',
            !validation.issues.includes('same-as-current') && newPassword
              ? 'text-secondary-foreground'
              : 'text-muted-foreground',
          )}
        >
          <Check
            className={cn(
              'size-3.5 shrink-0',
              !validation.issues.includes('same-as-current') && newPassword
                ? 'opacity-100'
                : 'opacity-30',
            )}
          />
          {passwordIssueLabel('same-as-current')}
        </li>
      </ul>

      <PasswordField
        id="confirmPassword"
        label="Confirmer le nouveau mot de passe"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />

      {confirmPassword && !passwordsMatch ? (
        <FormMessage>La confirmation ne correspond pas.</FormMessage>
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}
      {info ? <p className="text-sm text-foreground">{info}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="pill" disabled={!canSubmit}>
          {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={isSendingReset}
          onClick={() => void handleSendResetEmail()}
        >
          {isSendingReset ? 'Envoi...' : 'Mot de passe oublié ?'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Pour des raisons de sécurité, vous serez déconnecté de tous vos appareils après
        la mise à jour.
      </p>
    </form>
  )
}
