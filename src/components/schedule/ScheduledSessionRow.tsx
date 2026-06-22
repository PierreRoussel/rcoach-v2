import { Clock, Pencil, Repeat, Trash2 } from 'lucide-react'

import { describeScheduledSession } from '@/components/schedule/ScheduleSessionForm'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Pill } from '@/design-system'
import type { ScheduledSessionRecord } from '@/lib/graphql/operations'
import { cn } from '@/lib/utils'

type ScheduledSessionRowProps = {
  session: ScheduledSessionRecord
  onEdit: () => void
  onToggleActive: (active: boolean) => void
  onDelete: () => void
}

export function ScheduledSessionRow({
  session,
  onEdit,
  onToggleActive,
  onDelete,
}: ScheduledSessionRowProps) {
  const isWeekly = session.recurrence_type === 'weekly'

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-opacity',
        session.is_active
          ? 'border-border/80 bg-card shadow-sm'
          : 'border-dashed border-border/60 bg-muted/15 opacity-75',
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          session.is_active
            ? isWeekly
              ? 'bg-secondary'
              : 'bg-primary'
            : 'bg-muted-foreground/30',
        )}
      />

      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-base font-black">{session.title}</p>
            <Pill tone={isWeekly ? 'secondary' : 'primary'} className="py-0.5 text-[0.6rem] uppercase">
              {isWeekly ? (
                <>
                  <Repeat className="size-2.5" />
                  Recurrent
                </>
              ) : (
                'Ponctuel'
              )}
            </Pill>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {describeScheduledSession(session)}
            {session.workout_template?.name
              ? ` · ${session.workout_template.name}`
              : ''}
          </p>

          {session.time_local ? (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              {session.time_local.slice(0, 5)}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-medium text-muted-foreground">
              {session.is_active ? 'Actif' : 'Pause'}
            </span>
            <Switch
              checked={session.is_active}
              onCheckedChange={onToggleActive}
              aria-label={session.is_active ? 'Desactiver' : 'Activer'}
            />
          </div>
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
