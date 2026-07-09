import { AdminDataTable } from '@/components/admin/AdminDataTable'
import {
  formatAdminDate,
  formatAdminDateTime,
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
import { Pill } from '@/design-system'
import type { AdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import type { AdminRecentLists } from '@/lib/admin/recent-lists'
import { displayRevenueCents, revenueDisplaySuffix } from '@/lib/admin/revenue-urssaf'
import { formatCentsToEuros } from '@/lib/admin/metrics-range'

type AdminSubscriptionsTabProps = {
  data: AdminPlatformMetrics
  recentLists: AdminRecentLists | undefined
  listsLoading: boolean
  showNetAfterUrssaf: boolean
}

export function AdminSubscriptionsTab({
  data,
  recentLists,
  listsLoading,
  showNetAfterUrssaf,
}: AdminSubscriptionsTabProps) {
  const revenueSuffix = revenueDisplaySuffix(showNetAfterUrssaf)
  const mrrCents = displayRevenueCents(data.revenue.mrrCents, showNetAfterUrssaf)
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Premium actifs</p>
            <p className="font-display text-2xl font-black">{data.summary.premiumActive}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Essais en cours</p>
            <p className="font-display text-2xl font-black">{data.summary.trialingActive}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annulations</p>
            <p className="font-display text-2xl font-black">{data.summary.canceledSubscriptions}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MRR estimé ({revenueSuffix})</p>
            <p className="font-display text-2xl font-black">
              {formatCentsToEuros(mrrCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Derniers abonnements</CardTitle>
          <CardDescription>
            Créations et mises à jour récentes — tri par dernière activité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des abonnements...</p>
          ) : (
            <AdminDataTable
              rows={recentLists?.recentSubscriptions ?? []}
              getRowKey={(row) => row.id}
              emptyMessage="Aucun abonnement."
              columns={[
                { id: 'user', header: 'Utilisateur', cell: (row) => row.displayName },
                {
                  id: 'tier',
                  header: 'Offre',
                  cell: (row) => (
                    <Pill tone={row.tier === 'premium' ? 'solid-primary' : 'default'}>
                      {formatSubscriptionTier(row.tier)}
                    </Pill>
                  ),
                },
                { id: 'status', header: 'Statut', cell: (row) => formatSubscriptionStatus(row.status) },
                {
                  id: 'billing',
                  header: 'Formule',
                  cell: (row) => formatBillingPeriod(row.billingPeriod),
                },
                {
                  id: 'periodEnd',
                  header: 'Fin période',
                  cell: (row) => formatAdminDate(row.currentPeriodEnd),
                },
                {
                  id: 'updated',
                  header: 'Dernière activité',
                  cell: (row) => formatAdminDateTime(row.updatedAt),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Répartition détaillée</CardTitle>
            <CardDescription>Tous les abonnements par combinaison tier / statut / formule.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              rows={data.subscriptionsBreakdown}
              getRowKey={(row) => `${row.tier}-${row.status}-${row.billingPeriod ?? 'none'}`}
              emptyMessage="Aucun abonnement."
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
            <CardTitle className="font-display font-black">Motifs de churn</CardTitle>
            <CardDescription>Raisons d&apos;annulation sur la période sélectionnée.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              rows={data.churnReasons}
              getRowKey={(row) => row.reason}
              emptyMessage="Aucune annulation enregistrée."
              columns={[
                { id: 'reason', header: 'Motif', cell: (row) => row.reason },
                { id: 'count', header: 'Occurrences', cell: (row) => row.count },
              ]}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
