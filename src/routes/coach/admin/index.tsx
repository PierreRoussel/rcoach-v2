import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Activity,
  CreditCard,
  Filter,
  LineChart as LineChartIcon,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { z } from 'zod'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill, StatCard } from '@/design-system'
import { useAdminPlatformMetrics } from '@/hooks/useAdminPlatformMetrics'
import {
  computeRollingActiveUsers,
  formatCentsToEuros,
  funnelStepRate,
  type AdminMetricsRange,
} from '@/lib/admin/metrics-range'
import { requireAdmin } from '@/lib/auth/guards'

const RANGE_OPTIONS: Array<{ value: AdminMetricsRange; label: string }> = [
  { value: '7d', label: '7 j' },
  { value: '30d', label: '30 j' },
  { value: '90d', label: '90 j' },
  { value: '12m', label: '12 mois' },
]

const PIE_COLORS = [
  'var(--primary)',
  'var(--accent)',
  '#6b4fcc',
  '#f59e0b',
  '#10b981',
]

function formatChartDate(dateKey: string): string {
  try {
    return format(parseISO(dateKey), 'd MMM', { locale: fr })
  } catch {
    return dateKey
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—'
  }

  try {
    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: fr })
  } catch {
    return value
  }
}

export const Route = createFileRoute('/coach/admin/')({
  beforeLoad: requireAdmin,
  validateSearch: z.object({
    range: z.enum(['7d', '30d', '90d', '12m']).optional(),
  }),
  component: AdminPlatformDashboardPage,
})

function AdminPlatformDashboardPage() {
  const navigate = useNavigate({ from: '/coach/admin/' })
  const search = Route.useSearch()
  const range = search.range ?? '30d'
  const { data, isLoading, error } = useAdminPlatformMetrics(range)

  const signupsChart = useMemo(
    () =>
      data?.signupsDaily.map((entry) => ({
        date: formatChartDate(entry.date),
        inscriptions: entry.count,
        cumul: entry.cumulative ?? 0,
      })) ?? [],
    [data?.signupsDaily],
  )

  const activityChart = useMemo(() => {
    const daily = data?.activeUsersDaily ?? []
    const wauApprox = computeRollingActiveUsers(daily, 7)
    const mauApprox = computeRollingActiveUsers(daily, 30)

    return daily.map((entry, index) => ({
      date: formatChartDate(entry.date),
      dau: entry.dau,
      wauApprox: wauApprox[index]?.value ?? 0,
      mauApprox: mauApprox[index]?.value ?? 0,
    }))
  }, [data?.activeUsersDaily])

  const subscriptionPie = useMemo(() => {
    const map = new Map<string, number>()

    for (const row of data?.subscriptionsBreakdown ?? []) {
      const key = row.billingPeriod ?? 'non_renseigne'
      map.set(key, (map.get(key) ?? 0) + row.count)
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [data?.subscriptionsBreakdown])

  const funnelChart = useMemo(() => {
    if (!data?.funnel) {
      return []
    }

    const { funnel } = data
    return [
      { step: 'Inscrits', value: funnel.registered },
      { step: 'Onboarding', value: funnel.onboardingCompleted },
      { step: '1ère séance', value: funnel.firstWorkout },
      { step: '1er repas', value: funnel.firstMeal },
      { step: 'Essai démarré', value: funnel.trialStarted },
    ]
  }, [data?.funnel])

  const featureUsageChart = useMemo(() => {
    const workouts = data?.featureUsageDaily.workoutsDaily ?? []
    const meals = data?.featureUsageDaily.mealsDaily ?? []

    const dates = new Set([...workouts.map((e) => e.date), ...meals.map((e) => e.date)])
    const workoutMap = new Map(workouts.map((e) => [e.date, e.count]))
    const mealMap = new Map(meals.map((e) => [e.date, e.count]))

    return Array.from(dates)
      .sort()
      .map((date) => ({
        date: formatChartDate(date),
        seances: workoutMap.get(date) ?? 0,
        repas: mealMap.get(date) ?? 0,
      }))
  }, [data?.featureUsageDaily.mealsDaily, data?.featureUsageDaily.workoutsDaily])

  function setRange(nextRange: AdminMetricsRange) {
    void navigate({
      search: (previous) => ({ ...previous, range: nextRange }),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard plateforme"
        description="KPI agrégés de l'application — aucune donnée personnelle identifiable."
      />

      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Pill
            key={option.value}
            tone={range === option.value ? 'solid-primary' : 'default'}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </Pill>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des métriques...</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {data ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Vue d&apos;ensemble</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Croissance</CardTitle>
                <CardDescription>Inscriptions par jour et cumul sur la période.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {signupsChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune inscription sur la période.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signupsChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="inscriptions"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumul"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Activité</CardTitle>
                <CardDescription>
                  DAU (utilisateurs uniques / jour). WAU et MAU = sommes glissantes
                  approximatives.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {activityChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune activité sur la période.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="dau" stroke="var(--primary)" dot={false} />
                      <Line
                        type="monotone"
                        dataKey="wauApprox"
                        name="WAU approx."
                        stroke="#6b4fcc"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="mauApprox"
                        name="MAU approx."
                        stroke="var(--accent)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Abonnements</CardTitle>
                <CardDescription>
                  {data.summary.trialingActive} essais actifs ·{' '}
                  {data.summary.canceledSubscriptions} annulations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {subscriptionPie.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun abonnement.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {subscriptionPie.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Revenus estimés</CardTitle>
                <CardDescription>
                  Paiement non connecté — montants dérivés des abonnements actifs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.revenue.monthlySubscribers} abonnés mensuels ·{' '}
                  {data.revenue.annualSubscribers} annuels
                </p>
                {data.revenue.isEstimate ? (
                  <Pill tone="accent">Estimation — provider: none</Pill>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Usage produit</CardTitle>
                <CardDescription>
                  {data.featureUsageDaily.activeCoaches} coachs actifs sur la période.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {featureUsageChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune donnée d&apos;usage.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureUsageChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="seances" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="repas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="font-display font-black">Funnel</CardTitle>
                    <CardDescription>Progression des étapes clés depuis l&apos;inscription.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelChart} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="step" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number, _name, item) => {
                        const index = funnelChart.findIndex(
                          (row) => row.step === item.payload.step,
                        )
                        const previous =
                          index > 0 ? (funnelChart[index - 1]?.value ?? 0) : value
                        const rate = funnelStepRate(value, previous)
                        return [
                          `${value}${index > 0 ? ` (${rate}% vs étape préc.)` : ''}`,
                          'Utilisateurs',
                        ]
                      }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Rétention cohortes</CardTitle>
                <CardDescription>
                  Cohortes hebdomadaires — actif = séance ou repas loggé.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Semaine</th>
                      <th className="py-2 pr-3 font-medium">Inscrits</th>
                      <th className="py-2 pr-3 font-medium">J+7</th>
                      <th className="py-2 font-medium">J+30</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.retentionCohorts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-muted-foreground">
                          Pas encore de cohortes.
                        </td>
                      </tr>
                    ) : (
                      data.retentionCohorts.map((row) => (
                        <tr key={row.cohortWeek} className="border-b border-border/60">
                          <td className="py-2 pr-3">{row.cohortWeek}</td>
                          <td className="py-2 pr-3">{row.signupCount}</td>
                          <td className="py-2 pr-3">
                            {row.retentionJ7Pct == null ? '—' : `${row.retentionJ7Pct} %`}
                          </td>
                          <td className="py-2">
                            {row.retentionJ30Pct == null ? '—' : `${row.retentionJ30Pct} %`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="font-display font-black">Churn</CardTitle>
                <CardDescription>Raisons d&apos;annulation sur la période.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {data.churnReasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune annulation enregistrée.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.churnReasons}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6b4fcc" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Ops &amp; fraîcheur</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Users className="size-4" />}
                label="Profils"
                value={String(data.ops.profiles)}
                tone="primary"
              />
              <StatCard
                icon={<CreditCard className="size-4" />}
                label="Abonnements"
                value={String(data.ops.subscriptions)}
                tone="secondary"
              />
              <StatCard
                icon={<Activity className="size-4" />}
                label="Séances"
                value={String(data.ops.workouts)}
                tone="accent"
              />
              <StatCard
                icon={<LineChartIcon className="size-4" />}
                label="Repas loggés"
                value={String(data.ops.mealLogEntries)}
                tone="purple"
              />
            </div>
            <Card className="rounded-2xl border-border">
              <CardContent className="grid gap-2 p-4 text-sm text-muted-foreground sm:grid-cols-3">
                <p>Dernier profil : {formatDateTime(data.ops.latestProfileAt)}</p>
                <p>Dernière séance : {formatDateTime(data.ops.latestWorkoutAt)}</p>
                <p>Dernier repas : {formatDateTime(data.ops.latestMealLogAt)}</p>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Analytics produit persistés (erreurs sync, latence API) : non disponibles en v1.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
