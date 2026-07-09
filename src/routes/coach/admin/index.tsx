import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab'
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab'
import { AdminSubscriptionsTab } from '@/components/admin/AdminSubscriptionsTab'
import { AdminSupportTab } from '@/components/admin/AdminSupportTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, Pill } from '@/design-system'
import { useAdminPlatformMetrics } from '@/hooks/useAdminPlatformMetrics'
import { useAdminRecentLists } from '@/hooks/useAdminRecentLists'
import { useAdminSupportRequests } from '@/hooks/useAdminSupportRequests'
import type { AdminMetricsRange } from '@/lib/admin/metrics-range'
import { requireAdmin } from '@/lib/auth/guards'

const RANGE_OPTIONS: Array<{ value: AdminMetricsRange; label: string }> = [
  { value: '7d', label: '7 j' },
  { value: '30d', label: '30 j' },
  { value: '90d', label: '90 j' },
  { value: '12m', label: '12 mois' },
]

const ADMIN_TABS = ['overview', 'analytics', 'users', 'subscriptions', 'support'] as const
type AdminTab = (typeof ADMIN_TABS)[number]

function parseAdminTab(value: unknown): AdminTab {
  if (
    value === 'analytics' ||
    value === 'users' ||
    value === 'subscriptions' ||
    value === 'support'
  ) {
    return value
  }

  return 'overview'
}

export const Route = createFileRoute('/coach/admin/')({
  beforeLoad: requireAdmin,
  validateSearch: z.object({
    range: z.enum(['7d', '30d', '90d', '12m']).optional(),
    tab: z.enum(ADMIN_TABS).optional(),
  }),
  component: AdminPlatformDashboardPage,
})

function AdminPlatformDashboardPage() {
  const navigate = useNavigate({ from: '/coach/admin/' })
  const search = Route.useSearch()
  const range = search.range ?? '30d'
  const tab = parseAdminTab(search.tab)
  const [showNetAfterUrssaf, setShowNetAfterUrssaf] = useState(false)
  const { data, isLoading, error, refetch, isFetching } = useAdminPlatformMetrics(range)
  const {
    data: recentLists,
    isLoading: listsLoading,
    error: listsError,
  } = useAdminRecentLists(25)
  const {
    data: supportRequests,
    isLoading: supportLoading,
    error: supportError,
    refetch: refetchSupport,
  } = useAdminSupportRequests(50)

  function setRange(nextRange: AdminMetricsRange) {
    void navigate({
      search: (previous) => ({ ...previous, range: nextRange }),
    })
  }

  function setTab(nextTab: AdminTab) {
    void navigate({
      search: (previous) => ({ ...previous, tab: nextTab }),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard plateforme"
        description="KPI agrégés, tableaux et listes récentes — données pseudonymisées (pas d'email)."
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
        {isFetching ? (
          <span className="text-xs text-muted-foreground">Actualisation...</span>
        ) : null}
      </div>

      {error ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="font-display font-black text-destructive">
              Impossible de charger les métriques
            </CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Vérifiez que les migrations Nhost sont déployées (
              <code className="text-xs">admin_platform_metrics</code>,{' '}
              <code className="text-xs">admin_platform_recent_lists</code>).
            </p>
            <button
              type="button"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => void refetch()}
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      ) : null}

      {listsError ? (
        <p className="text-sm text-destructive">
          Listes récentes :{' '}
          {listsError instanceof Error ? listsError.message : 'erreur de chargement'}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(parseAdminTab(value))}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-xl">
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl">
            Graphiques
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl">
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-xl">
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="support" className="rounded-xl">
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des métriques...</p>
          ) : data ? (
            <AdminOverviewTab
              data={data}
              showNetAfterUrssaf={showNetAfterUrssaf}
              onShowNetAfterUrssafChange={setShowNetAfterUrssaf}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Aucune métrique disponible.</p>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des graphiques...</p>
          ) : data ? (
            <AdminAnalyticsTab data={data} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucune donnée pour les graphiques.</p>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : data ? (
            <AdminUsersTab data={data} recentLists={recentLists} listsLoading={listsLoading} />
          ) : (
            <p className="text-sm text-muted-foreground">Métriques utilisateurs indisponibles.</p>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : data ? (
            <AdminSubscriptionsTab
              data={data}
              recentLists={recentLists}
              listsLoading={listsLoading}
              showNetAfterUrssaf={showNetAfterUrssaf}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Métriques abonnements indisponibles.</p>
          )}
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <AdminSupportTab
            requests={supportRequests?.requests}
            isLoading={supportLoading}
            error={supportError}
            onRetry={() => void refetchSupport()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
