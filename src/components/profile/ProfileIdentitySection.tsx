import { useEffect, useState } from 'react'

import { AvatarEditor } from '@/components/social/AvatarEditor'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthUserLocale } from '@/hooks/useAuthUserLocale'
import { useUpdateProfile } from '@/hooks/useProfile'
import type { UserLocale } from '@/lib/i18n/user-locale'
import { useSubscriptionSummary } from '@/hooks/useSubscription'
import type { Profile } from '@/lib/graphql/operations'
import {
  canEditProfileRole,
  type EditableProfileRole,
} from '@/lib/profile/roles'

type ProfileIdentitySectionProps = {
  profile: Profile
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const {
    locale: accountLocale,
    isLoading: isAccountLocaleLoading,
    updateLocale,
    isUpdating: isAccountLocaleUpdating,
  } = useAuthUserLocale()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [unitSystem, setUnitSystem] = useState(profile.unit_system)
  const [accountLanguage, setAccountLanguage] = useState<UserLocale>(accountLocale)
  const [exerciseLocale, setExerciseLocale] = useState(profile.exercise_locale ?? 'fr')
  const [role, setRole] = useState<EditableProfileRole>(
    profile.role === 'admin' ? 'athlete' : profile.role,
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAccountLocaleLoading) {
      setAccountLanguage(accountLocale)
    }
  }, [accountLocale, isAccountLocaleLoading])

  async function handleSave() {
    setSuccessMessage(null)
    setError(null)

    try {
      const profilePromise = updateProfile.mutateAsync({
        profileId: profile.id,
        changes: {
          display_name: displayName,
          unit_system: unitSystem,
          exercise_locale: exerciseLocale,
          ...(canEditProfileRole(profile) ? { role } : {}),
        },
      })
      const localePromise =
        accountLanguage !== accountLocale
          ? updateLocale(accountLanguage)
          : Promise.resolve(accountLocale)

      await Promise.all([profilePromise, localePromise])
      setSuccessMessage('Profil mis à jour.')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de mettre à jour le profil.',
      )
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom affiché</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitSystem">Unité de poids</Label>
        <select
          id="unitSystem"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={unitSystem}
          onChange={(event) => setUnitSystem(event.target.value as 'kg' | 'lb')}
        >
          <option value="kg">Kilogrammes (kg)</option>
          <option value="lb">Livres (lb)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountLanguage">Langue du compte</Label>
        <select
          id="accountLanguage"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={accountLanguage}
          disabled={isAccountLocaleLoading}
          onChange={(event) =>
            setAccountLanguage(event.target.value as UserLocale)
          }
        >
          <option value="fr">Francais</option>
          <option value="en">Anglais</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Utilisee pour les e-mails du compte (verification, mot de passe).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="exerciseLocale">Langue des exercices</Label>
        <select
          id="exerciseLocale"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={exerciseLocale}
          onChange={(event) => setExerciseLocale(event.target.value as 'fr' | 'en')}
        >
          <option value="fr">Francais (noms traduits)</option>
          <option value="en">Anglais (noms d&apos;origine)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        {canEditProfileRole(profile) ? (
          <select
            id="role"
            className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value as EditableProfileRole)}
          >
            <option value="athlete">Athlète</option>
            <option value="coach">Coach</option>
            <option value="both">Athlète + Coach</option>
          </select>
        ) : (
          <p className="text-sm text-muted-foreground">
            Administrateur plateforme (rôle géré en base de données).
          </p>
        )}
      </div>
      <p className="font-data text-xs text-muted-foreground">
        Cree le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
      </p>
      <Button
        type="button"
        variant="pill"
        onClick={() => void handleSave()}
        disabled={
          updateProfile.isPending || isAccountLocaleUpdating || isAccountLocaleLoading
        }
      >
        {updateProfile.isPending || isAccountLocaleUpdating
          ? 'Enregistrement...'
          : 'Enregistrer'}
      </Button>
      {successMessage ? (
        <FeedbackMessage variant="success">{successMessage}</FeedbackMessage>
      ) : null}
      {error ? <FeedbackMessage variant="error">{error}</FeedbackMessage> : null}
    </>
  )
}

export function ProfileIdentitySection({ profile }: ProfileIdentitySectionProps) {
  const { isPremium } = useSubscriptionSummary()

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="font-display font-black">Identite</CardTitle>
        <CardDescription>
          Mettez à jour votre nom, votre avatar et vos unités de mesure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AvatarEditor
          profileId={profile.id}
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          isPremium={isPremium}
        />
        <ProfileEditor key={profile.id} profile={profile} />
      </CardContent>
    </Card>
  )
}
