import { AdminDataTable } from '@/components/admin/AdminDataTable'
import {
  formatAdminDate,
  formatAdminDateTime,
  formatProfileRole,
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

type AdminUsersTabProps = {
  data: AdminPlatformMetrics
  recentLists: AdminRecentLists | undefined
  listsLoading: boolean
}

export function AdminUsersTab({ data, recentLists, listsLoading }: AdminUsersTabProps) {
  const signupsTable = [...data.signupsDaily].reverse()

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Derniers utilisateurs inscrits</CardTitle>
          <CardDescription>
            25 derniers profils créés — nom affiché uniquement, sans email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des inscriptions...</p>
          ) : (
            <AdminDataTable
              rows={recentLists?.recentUsers ?? []}
              getRowKey={(row) => row.id}
              emptyMessage="Aucun utilisateur."
              columns={[
                { id: 'name', header: 'Nom', cell: (row) => row.displayName },
                { id: 'role', header: 'Rôle', cell: (row) => formatProfileRole(row.role) },
                {
                  id: 'premium',
                  header: 'Premium',
                  cell: (row) => (
                    <Pill tone={row.isPremium ? 'solid-primary' : 'default'}>
                      {row.isPremium ? 'Oui' : 'Non'}
                    </Pill>
                  ),
                },
                {
                  id: 'onboarding',
                  header: 'Onboarding',
                  cell: (row) => (row.onboardingCompletedAt ? 'Terminé' : 'En cours'),
                },
                {
                  id: 'created',
                  header: 'Inscription',
                  cell: (row) => formatAdminDateTime(row.createdAt),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Inscriptions par jour</CardTitle>
          <CardDescription>
            Période {formatAdminDate(data.range.from)} → {formatAdminDate(data.range.to)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            rows={signupsTable}
            getRowKey={(row) => row.date}
            emptyMessage="Aucune inscription sur la période."
            columns={[
              { id: 'date', header: 'Date', cell: (row) => formatAdminDate(row.date) },
              { id: 'count', header: 'Nouveaux', cell: (row) => row.count },
              { id: 'cumul', header: 'Cumul', cell: (row) => row.cumulative ?? 0 },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Activité quotidienne (DAU)</CardTitle>
          <CardDescription>Utilisateurs uniques actifs par jour.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            rows={[...data.activeUsersDaily].reverse()}
            getRowKey={(row) => row.date}
            emptyMessage="Aucune activité sur la période."
            columns={[
              { id: 'date', header: 'Date', cell: (row) => formatAdminDate(row.date) },
              { id: 'dau', header: 'DAU', cell: (row) => row.dau },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
