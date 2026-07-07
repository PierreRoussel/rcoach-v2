import { useState } from 'react'

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
import { useUpdateProfile } from '@/hooks/useProfile'
import { useSubscriptionSummary } from '@/hooks/useSubscription'
import type { Profile } from '@/lib/graphql/operations'

type ProfileIdentitySectionProps = {
  profile: Profile
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [unitSystem, setUnitSystem] = useState(profile.unit_system)
  const [exerciseLocale, setExerciseLocale] = useState(profile.exercise_locale ?? 'fr')
  const [role, setRole] = useState(profile.role)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSuccessMessage(null)
    setError(null)

    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        changes: {
          display_name: displayName,
          unit_system: unitSystem,
          exercise_locale: exerciseLocale,
          role,
        },
      })
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
        <select
          id="role"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as 'athlete' | 'coach' | 'both')}
        >
          <option value="athlete">Athlète</option>
          <option value="coach">Coach</option>
          <option value="both">Athlète + Coach</option>
        </select>
      </div>
      <p className="font-data text-xs text-muted-foreground">
        Cree le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
      </p>
      <Button
        type="button"
        variant="pill"
        onClick={() => void handleSave()}
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
