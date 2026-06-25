import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { formatRelativeWorkoutDate } from '@/lib/coach/client-dashboard'
import type { ClientActivityRow } from '@/lib/coach/client-dashboard'

type CoachClientActivityListProps = {
  rows: ClientActivityRow[]
}

export function CoachClientActivityList({
  rows,
}: CoachClientActivityListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun client actif pour le moment.
        </p>
        <Button variant="pill" className="mt-4" asChild>
          <Link to="/coach/clients">Inviter un client</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.clientId}
          className="rounded-xl border border-border p-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display font-bold">{row.label}</p>
              {row.email ? (
                <p className="text-xs text-muted-foreground">{row.email}</p>
              ) : null}
            </div>
            {row.isInactive ? <Pill tone="default">Inactif</Pill> : null}
          </div>

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Dernière séance</p>
              <p className="font-medium">
                {formatRelativeWorkoutDate(row.lastWorkoutAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">7 derniers jours</p>
              <p className="font-medium">{row.sessionsLast7Days} séance(s)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume 7 j</p>
              <p className="font-medium">
                {Math.round(row.volumeLast7Days).toLocaleString('fr-FR')} kg
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
