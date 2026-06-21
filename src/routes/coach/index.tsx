import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, CalendarDays, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill, StatCard } from '@/design-system'
import {
  useClientWorkouts,
  useCoachClients,
  useCoachPrograms,
} from '@/hooks/useCoach'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach/')({
  component: CoachHomePage,
})

function CoachHomePage() {
  const { data: profile } = useMyProfile()
  const { data: clients } = useCoachClients()
  const { data: programs } = useCoachPrograms()
  const { data: workouts } = useClientWorkouts(20)

  const activeClients =
    clients?.filter((client) => client.status === 'active').length ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Dashboard"
        description="Gestion clients, programmes templates et suivi d activite."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="size-4" />}
          label="Clients actifs"
          value={String(activeClients)}
          tone="primary"
        />
        <StatCard
          icon={<CalendarDays className="size-4" />}
          label="Programmes"
          value={String(programs?.length ?? 0)}
          tone="secondary"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Seances clients"
          value={String(workouts?.length ?? 0)}
          tone="accent"
        />
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">
                Vue d&apos;ensemble
              </CardTitle>
              <CardDescription>
                Connecte en tant que {profile?.display_name ?? '—'}
              </CardDescription>
            </div>
            <Pill tone="primary">{profile?.role ?? 'athlete'}</Pill>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="pill" asChild>
            <Link to="/coach/clients">Gerer les clients</Link>
          </Button>
          <Button variant="soft" asChild>
            <Link to="/coach/programs">Programmes</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/coach/analytics">Analytics</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
