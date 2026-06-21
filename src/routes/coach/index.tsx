import { createFileRoute } from '@tanstack/react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach/')({
  component: CoachHomePage,
})

function CoachHomePage() {
  const { data: profile } = useMyProfile()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard coach</CardTitle>
        <CardDescription>
          Shell ERP Phase 0 — gestion clients et analytics en Phase 2.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Connecte en tant que{' '}
          <span className="font-medium">{profile?.display_name ?? '—'}</span>
        </p>
        <p className="text-muted-foreground">
          Role actuel : {profile?.role ?? 'athlete'}
        </p>
      </CardContent>
    </Card>
  )
}
