import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, ThemeToggle } from '@/design-system'
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/app/profile')({
  component: ProfilePage,
})

function ProfileEditor({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof useMyProfile>['data']>
}) {
  const updateProfile = useUpdateProfile()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [unitSystem, setUnitSystem] = useState(profile.unit_system)
  const [role, setRole] = useState(profile.role)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    setMessage(null)

    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        changes: {
          display_name: displayName,
          unit_system: unitSystem,
          role,
        },
      })
      setMessage('Profil mis a jour.')
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de mettre a jour le profil.',
      )
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom affiche</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitSystem">Unite de poids</Label>
        <select
          id="unitSystem"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={unitSystem}
          onChange={(event) =>
            setUnitSystem(event.target.value as 'kg' | 'lb')
          }
        >
          <option value="kg">Kilogrammes (kg)</option>
          <option value="lb">Livres (lb)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as 'athlete' | 'coach' | 'both')
          }
        >
          <option value="athlete">Athlete</option>
          <option value="coach">Coach</option>
          <option value="both">Athlete + Coach</option>
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
      {message ? <FormMessage>{message}</FormMessage> : null}
    </>
  )
}

function ProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          eyebrow="Compte"
          title="Profil"
          description="Informations du compte et preferences d'affichage."
        />
        <ThemeToggle />
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Identite</CardTitle>
          <CardDescription>
            Mettez a jour votre nom et vos unites de mesure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur de chargement'}
            </p>
          ) : null}
          {profile ? <ProfileEditor key={profile.id} profile={profile} /> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Import</CardTitle>
          <CardDescription>
            Importer un export CSV depuis Hevy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="soft" asChild>
            <Link to="/app/import">Aller a l&apos;import Hevy</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
