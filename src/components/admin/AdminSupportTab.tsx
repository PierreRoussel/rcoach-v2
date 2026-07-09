import { AdminDataTable } from '@/components/admin/AdminDataTable'
import {
  formatAdminDateTime,
  formatSupportRequestStatus,
} from '@/components/admin/admin-format'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill } from '@/design-system'
import type { AdminSupportRequest } from '@/lib/admin/support-requests'

type AdminSupportTabProps = {
  requests: AdminSupportRequest[] | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

function supportStatusTone(
  status: AdminSupportRequest['status'],
): 'solid-primary' | 'accent' | 'default' {
  switch (status) {
    case 'open':
      return 'solid-primary'
    case 'in_progress':
      return 'accent'
    default:
      return 'default'
  }
}

export function AdminSupportTab({
  requests,
  isLoading,
  error,
  onRetry,
}: AdminSupportTabProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Demandes de support</CardTitle>
          <CardDescription>
            Messages envoyés depuis l&apos;application — nom affiché uniquement, sans email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-3 text-sm">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Erreur de chargement'}
              </p>
              <button
                type="button"
                className="font-semibold text-primary underline-offset-2 hover:underline"
                onClick={onRetry}
              >
                Réessayer
              </button>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des demandes...</p>
          ) : (
            <AdminDataTable
              rows={requests ?? []}
              getRowKey={(row) => row.id}
              emptyMessage="Aucune demande de support."
              columns={[
                {
                  id: 'created',
                  header: 'Date',
                  cell: (row) => formatAdminDateTime(row.createdAt),
                },
                {
                  id: 'user',
                  header: 'Utilisateur',
                  cell: (row) => row.displayName,
                },
                {
                  id: 'subject',
                  header: 'Sujet',
                  cell: (row) => row.subject,
                },
                {
                  id: 'message',
                  header: 'Message',
                  className: 'max-w-md',
                  cell: (row) => (
                    <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                      {row.message}
                    </p>
                  ),
                },
                {
                  id: 'status',
                  header: 'Statut',
                  cell: (row) => (
                    <Pill tone={supportStatusTone(row.status)}>
                      {formatSupportRequestStatus(row.status)}
                    </Pill>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
