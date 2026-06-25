import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, CalendarDays, Mail, Users } from 'lucide-react'

import { CoachClientActivityList } from '@/components/coach/CoachClientActivityList'
import { CoachRecentSessions } from '@/components/coach/CoachRecentSessions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill, StatCard } from '@/design-system'
import { useCoachDashboard } from '@/hooks/useCoachDashboard'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach/')({
  component: CoachHomePage,
})

function CoachHomePage() {
  const { data: profile } = useMyProfile()
  const {
    stats,
    clientRows,
    recentWorkouts,
    pendingCount,
    isLoading,
    error,
  } = useCoachDashboard()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Dashboard"
        description="Suivez l'activité de vos clients et vos invitations en attente."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" />}
          label="Clients actifs"
          value={String(stats.activeClients)}
          tone="primary"
        />
        <StatCard
          icon={<Mail className="size-4" />}
          label="Invitations en attente"
          value={String(stats.pendingInvites)}
          tone="secondary"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Séances 7 jours"
          value={String(stats.sessionsLast7Days)}
          tone="accent"
        />
        <StatCard
          icon={<CalendarDays className="size-4" />}
          label="Volume 7 jours"
          value={`${Math.round(stats.volumeLast7Days).toLocaleString('fr-FR')} kg`}
          tone="purple"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du dashboard...</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {pendingCount > 0 ? (
        <Card className="rounded-2xl border-border bg-soft-secondary/40">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-bold">
                {pendingCount} invitation{pendingCount > 1 ? 's' : ''} en attente
              </p>
              <p className="text-sm text-muted-foreground">
                Activez vos clients pour suivre leur activité.
              </p>
            </div>
            <Button variant="pill" asChild>
              <Link to="/coach/clients">Gérer les clients</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">
                Mes clients actifs
              </CardTitle>
              <CardDescription>
                Dernière activité et volume sur les 7 derniers jours.
              </CardDescription>
            </div>
            <Pill tone="primary">{clientRows.length}</Pill>
          </div>
        </CardHeader>
        <CardContent>
          <CoachClientActivityList rows={clientRows} />
        </CardContent>
      </Card>

      <CoachRecentSessions workouts={recentWorkouts} />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">
                Vue d&apos;ensemble
              </CardTitle>
              <CardDescription>
                Connecté en tant que {profile?.display_name ?? '—'}
              </CardDescription>
            </div>
            <Pill tone="primary">{profile?.role ?? 'athlète'}</Pill>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="pill" asChild>
            <Link to="/coach/clients">Gérer les clients</Link>
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
