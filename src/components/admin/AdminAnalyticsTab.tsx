import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Filter } from 'lucide-react'
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

import { AdminDataTable } from '@/components/admin/AdminDataTable'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { AdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { computeRollingActiveUsers, funnelStepRate } from '@/lib/admin/metrics-range'

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

type AdminAnalyticsTabProps = {
  data: AdminPlatformMetrics
}

export function AdminAnalyticsTab({ data }: AdminAnalyticsTabProps) {
  const signupsChart = useMemo(
    () =>
      data.signupsDaily.map((entry) => ({
        date: formatChartDate(entry.date),
        inscriptions: entry.count,
        cumul: entry.cumulative ?? 0,
      })),
    [data.signupsDaily],
  )

  const activityChart = useMemo(() => {
    const daily = data.activeUsersDaily
    const wauApprox = computeRollingActiveUsers(daily, 7)
    const mauApprox = computeRollingActiveUsers(daily, 30)

    return daily.map((entry, index) => ({
      date: formatChartDate(entry.date),
      dau: entry.dau,
      wauApprox: wauApprox[index]?.value ?? 0,
      mauApprox: mauApprox[index]?.value ?? 0,
    }))
  }, [data.activeUsersDaily])

  const subscriptionPie = useMemo(() => {
    const map = new Map<string, number>()

    for (const row of data.subscriptionsBreakdown) {
      const key = row.billingPeriod ?? 'non_renseigne'
      map.set(key, (map.get(key) ?? 0) + row.count)
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [data.subscriptionsBreakdown])

  const funnelChart = useMemo(
    () => [
      { step: 'Inscrits', value: data.funnel.registered },
      { step: 'Onboarding', value: data.funnel.onboardingCompleted },
      { step: '1ère séance', value: data.funnel.firstWorkout },
      { step: '1er repas', value: data.funnel.firstMeal },
      { step: 'Essai démarré', value: data.funnel.trialStarted },
    ],
    [data.funnel],
  )

  const featureUsageChart = useMemo(() => {
    const workouts = data.featureUsageDaily.workoutsDaily
    const meals = data.featureUsageDaily.mealsDaily
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
  }, [data.featureUsageDaily.mealsDaily, data.featureUsageDaily.workoutsDaily])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Croissance</CardTitle>
            <CardDescription>Inscriptions par jour et cumul.</CardDescription>
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
                  <Line type="monotone" dataKey="inscriptions" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumul" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Activité</CardTitle>
            <CardDescription>DAU, WAU et MAU approximatifs.</CardDescription>
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
                  <Line type="monotone" dataKey="wauApprox" name="WAU approx." stroke="#6b4fcc" dot={false} />
                  <Line type="monotone" dataKey="mauApprox" name="MAU approx." stroke="var(--accent)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Formules d&apos;abonnement</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {subscriptionPie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun abonnement.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subscriptionPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {subscriptionPie.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
            <CardTitle className="font-display font-black">Usage produit</CardTitle>
            <CardDescription>Séances et repas loggés par jour.</CardDescription>
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
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <div>
                <CardTitle className="font-display font-black">Funnel</CardTitle>
                <CardDescription>Progression des étapes clés.</CardDescription>
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
                  formatter={(value, _name, item) => {
                    const numeric = typeof value === 'number' ? value : Number(value ?? 0)
                    const index = funnelChart.findIndex((row) => row.step === item.payload.step)
                    const previous = index > 0 ? (funnelChart[index - 1]?.value ?? 0) : numeric
                    const rate = funnelStepRate(numeric, previous)
                    return [`${numeric}${index > 0 ? ` (${rate}% vs étape préc.)` : ''}`, 'Utilisateurs']
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Churn (graphique)</CardTitle>
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

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Rétention par cohortes</CardTitle>
          <CardDescription>Cohortes hebdomadaires — actif = séance ou repas loggé.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            rows={data.retentionCohorts}
            getRowKey={(row) => row.cohortWeek}
            emptyMessage="Pas encore de cohortes."
            columns={[
              { id: 'week', header: 'Semaine', cell: (row) => row.cohortWeek },
              { id: 'signups', header: 'Inscrits', cell: (row) => row.signupCount },
              {
                id: 'j7',
                header: 'J+7',
                cell: (row) => (row.retentionJ7Pct == null ? '—' : `${row.retentionJ7Pct} %`),
              },
              {
                id: 'j30',
                header: 'J+30',
                cell: (row) => (row.retentionJ30Pct == null ? '—' : `${row.retentionJ30Pct} %`),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
