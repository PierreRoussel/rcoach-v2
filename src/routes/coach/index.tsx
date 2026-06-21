import { createFileRoute } from '@tanstack/react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill } from '@/design-system'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach/')({
  component: CoachHomePage,
})

function CoachHomePage() {
  const { data: profile } = useMyProfile()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Dashboard"
        description="Shell ERP Phase 0 — gestion clients et analytics en Phase 2."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">
                Vue d&apos;ensemble
              </CardTitle>
              <CardDescription>
                Informations du profil connecte.
              </CardDescription>
            </div>
            <Pill tone="primary">{profile?.role ?? 'athlete'}</Pill>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Connecte en tant que{' '}
            <span className="font-display font-black">
              {profile?.display_name ?? '—'}
            </span>
          </p>
          <p className="text-muted-foreground">
            Role actuel : {profile?.role ?? 'athlete'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
