import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { ProfileIdentitySection } from '@/components/profile/ProfileIdentitySection'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/design-system'
import { isGoogleOnlyAccount, useMyAuthProviders } from '@/hooks/useAuthProviders'
import { useMyProfile } from '@/hooks/useProfile'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/app/profile/settings')({
  component: AccountSettingsPage,
})

function AccountSettingsPage() {
  const { user } = useAuth()
  const { data: profile, isLoading, error } = useMyProfile()
  const { data: providerIds } = useMyAuthProviders()
  const email = user?.email ?? ''
  const googleOnly = isGoogleOnlyAccount(providerIds)

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-full border-border/70 bg-card shadow-sm"
          asChild
        >
          <Link to="/app/profile" aria-label="Retour au profil">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <PageHeader
          title="Configuration du compte"
          description="Gérez votre identité et la sécurité de votre compte."
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {profile ? <ProfileIdentitySection profile={profile} /> : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Compte</CardTitle>
          <CardDescription>
            {googleOnly
              ? 'Vous vous connectez via Google.'
              : 'Modifiez votre mot de passe en confirmant votre mot de passe actuel.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleOnly ? (
            <p className="text-sm text-muted-foreground">
              La gestion du mot de passe se fait depuis votre compte Google.
            </p>
          ) : email ? (
            <ChangePasswordForm email={email} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune adresse email associée à ce compte.
            </p>
          )}
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
