import {
  Activity,
  CreditCard,
  LineChart as LineChartIcon,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'

import { AdminDataTable } from '@/components/admin/AdminDataTable'
import {
  formatAdminDate,
  formatBillingPeriod,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from '@/components/admin/admin-format'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill, StatCard } from '@/design-system'
import type { AdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { formatCentsToEuros, funnelStepRate } from '@/lib/admin/metrics-range'

type AdminOverviewTabProps = {
  data: AdminPlatformMetrics
}

export function AdminOverviewTab({ data }: AdminOverviewTabProps) {
  const funnelRows = [
    { step: 'Inscrits', value: data.funnel.registered },
    { step: 'Onboarding terminé', value: data.funnel.onboardingCompleted },
    { step: '1ère séance', value: data.funnel.firstWorkout },
    { step: '1er repas loggé', value: data.funnel.firstMeal },
    { step: 'Essai démarré', value: data.funnel.trialStarted },
  ]

  const recentSignups = [...data.signupsDaily]
    .filter((entry) => entry.count > 0)
    .slice(-14)
    .reverse()

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          icon={<Users className="size-4" />}
          label="Utilisateurs"
          value={String(data.summary.totalUsers)}
          tone="primary"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Nouveaux (période)"
          value={String(data.summary.newUsersInRange)}
          tone="secondary"
        />
        <StatCard
          icon={<Shield className="size-4" />}
          label="Premium actifs"
          value={String(data.summary.premiumActive)}
          tone="accent"
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="Gratuits"
          value={String(data.summary.freeActive)}
          tone="purple"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="DAU (dernier jour)"
          value={String(data.summary.latestDau)}
          tone="primary"
        />
        <StatCard
          icon={<CreditCard className="size-4" />}
          label="MRR estimé"
          value={formatCentsToEuros(data.revenue.mrrCents)}
          tone="accent"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Répartition des abonnements</CardTitle>
            <CardDescription>Par tier, statut et formule.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              rows={data.subscriptionsBreakdown}
              getRowKey={(row) => `${row.tier}-${row.status}-${row.billingPeriod ?? 'none'}`}
              emptyMessage="Aucun abonnement enregistré."
              columns={[
                { id: 'tier', header: 'Offre', cell: (row) => formatSubscriptionTier(row.tier) },
                { id: 'status', header: 'Statut', cell: (row) => formatSubscriptionStatus(row.status) },
                {
                  id: 'billing',
                  header: 'Formule',
                  cell: (row) => formatBillingPeriod(row.billingPeriod),
                },
                { id: 'count', header: 'Nombre', cell: (row) => row.count },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Funnel d&apos;activation</CardTitle>
            <CardDescription>Étapes clés depuis l&apos;inscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              rows={funnelRows}
              getRowKey={(row) => row.step}
              columns={[
                { id: 'step', header: 'Étape', cell: (row) => row.step },
                { id: 'value', header: 'Utilisateurs', cell: (row) => row.value },
                {
                  id: 'rate',
                  header: 'Conv. vs préc.',
                  cell: (row) => {
                    const index = funnelRows.findIndex((entry) => entry.step === row.step)
                    const previous = index > 0 ? funnelRows[index - 1]?.value ?? 0 : row.value
                    return index === 0 ? '—' : `${funnelStepRate(row.value, previous)} %`
                  },
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Inscriptions récentes</CardTitle>
            <CardDescription>Jours avec au moins une inscription (14 derniers jours de la période).</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              rows={recentSignups}
              getRowKey={(row) => row.date}
              emptyMessage="Aucune inscription sur la période."
              columns={[
                { id: 'date', header: 'Date', cell: (row) => formatAdminDate(row.date) },
                { id: 'count', header: 'Inscriptions', cell: (row) => row.count },
                {
                  id: 'cumul',
                  header: 'Cumul période',
                  cell: (row) => row.cumulative ?? '—',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Activité &amp; données</CardTitle>
            <CardDescription>Volumes globaux et fraîcheur des données.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminDataTable
              rows={[
                { label: 'Profils', value: data.ops.profiles },
                { label: 'Abonnements', value: data.ops.subscriptions },
                { label: 'Séances', value: data.ops.workouts },
                { label: 'Repas loggés', value: data.ops.mealLogEntries },
                { label: 'Coachs actifs', value: data.featureUsageDaily.activeCoaches },
              ]}
              getRowKey={(row) => row.label}
              columns={[
                { id: 'label', header: 'Métrique', cell: (row) => row.label },
                { id: 'value', header: 'Total', cell: (row) => row.value },
              ]}
            />
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <p>Dernier profil : {formatAdminDate(data.ops.latestProfileAt)}</p>
              <p>Dernière séance : {formatAdminDate(data.ops.latestWorkoutAt)}</p>
              <p>Dernier repas : {formatAdminDate(data.ops.latestMealLogAt)}</p>
            </div>
            {data.revenue.isEstimate ? (
              <Pill tone="accent">Revenus estimés — paiement non connecté</Pill>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Revenus estimés</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CreditCard className="size-4" />}
            label="MRR"
            value={formatCentsToEuros(data.revenue.mrrCents)}
            tone="primary"
          />
          <StatCard
            icon={<LineChartIcon className="size-4" />}
            label="ARR"
            value={formatCentsToEuros(data.revenue.arrCents)}
            tone="secondary"
          />
          <StatCard
            icon={<Users className="size-4" />}
            label="Mensuels"
            value={String(data.revenue.monthlySubscribers)}
            tone="purple"
          />
          <StatCard
            icon={<Shield className="size-4" />}
            label="Annuels"
            value={String(data.revenue.annualSubscribers)}
            tone="accent"
          />
        </CardContent>
      </Card>
    </div>
  )
}
