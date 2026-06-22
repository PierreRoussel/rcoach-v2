import { createFileRoute, Link } from '@tanstack/react-router'
import { parseISO } from 'date-fns'
import { ArrowLeft, CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { WorkoutCalendarPanel } from '@/components/schedule/CalendarDayDetail'
import {
  describeScheduledSession,
  ScheduleSessionForm,
  sessionListItemClass,
  type ScheduleFormValues,
} from '@/components/schedule/ScheduleSessionForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/design-system'
import { useCalendarData } from '@/hooks/useCalendarData'
import {
  SCHEDULE_NOT_DEPLOYED_MESSAGE,
  useCreateScheduledSession,
  useDeleteScheduledSession,
  useScheduledSessions,
  useUpdateScheduledSession,
} from '@/hooks/useScheduledSessions'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { resolveScheduleTitle } from '@/lib/schedule/resolve-schedule-title'
import type { ScheduledSessionRecord } from '@/lib/graphql/operations'

export const Route = createFileRoute('/app/planning/')({
  validateSearch: (search: Record<string, unknown>) => {
    const date =
      typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined

    return date ? { date } : {}
  },
  component: PlanningPage,
})

function PlanningPage() {
  const { date: initialDateParam } = Route.useSearch()
  const initialDate = initialDateParam
    ? parseISO(`${initialDateParam}T12:00:00`)
    : undefined

  const { markers, weeklyStreak, isLoading, error, scheduleMissing } =
    useCalendarData()
  const { data: sessionsResult } = useScheduledSessions({ includeInactive: true })
  const sessions = sessionsResult?.sessions ?? []
  const { data: templates } = useWorkoutTemplates()
  const createSession = useCreateScheduledSession()
  const updateSession = useUpdateScheduledSession()
  const deleteSession = useDeleteScheduledSession()
  const { startPlannedSession, isStarting } = useStartPlannedSession()

  const [editing, setEditing] = useState<ScheduledSessionRecord | null>(null)
  const [showForm, setShowForm] = useState(Boolean(initialDate))
  const [formDate, setFormDate] = useState<Date | undefined>(initialDate)

  function openPlanForm(date: Date) {
    setEditing(null)
    setFormDate(date)
    setShowForm(true)
  }

  async function handleSubmit(values: ScheduleFormValues) {
    const templateOptions = (templates ?? []).map((template) => ({
      id: template.id,
      name: template.name,
    }))
    const title = resolveScheduleTitle(values, templateOptions)

    const payload = {
      title,
      workout_template_id: values.workoutTemplateId,
      recurrence_type: values.recurrenceType,
      weekdays: values.recurrenceType === 'weekly' ? values.weekdays : null,
      scheduled_date:
        values.recurrenceType === 'once' ? values.scheduledDate : null,
      time_local: values.timeLocal ? `${values.timeLocal}:00` : null,
      start_date:
        values.recurrenceType === 'once'
          ? values.scheduledDate
          : values.startDate,
      end_date: values.endDate || null,
      is_active: true,
    }

    if (editing) {
      await updateSession.mutateAsync({ id: editing.id, changes: payload })
      setEditing(null)
      setShowForm(false)
      return
    }

    await createSession.mutateAsync(payload)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/app/stats">
          <ArrowLeft className="size-4" />
          Stats
        </Link>
      </Button>

      <PageHeader
        eyebrow="Planning"
        title="Calendrier d entrainement"
        description="Visualisez vos seances realisees, planifiez les prochaines et suivez votre regularite."
      />

      {scheduleMissing ? (
        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {SCHEDULE_NOT_DEPLOYED_MESSAGE}{' '}
            Le calendrier affiche deja vos seances realisees.
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : null}

      {error && !scheduleMissing ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Calendrier</CardTitle>
          <CardDescription>
            Touchez un jour pour voir le detail et demarrer une seance planifiee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkoutCalendarPanel
            markers={markers}
            mode="full"
            streak={weeklyStreak}
            onStartPlanned={(occurrence) => void startPlannedSession(occurrence)}
            onPlanDate={openPlanForm}
            isStarting={isStarting}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display font-black">
                {editing ? 'Modifier la planification' : 'Nouvelle planification'}
              </CardTitle>
              <CardDescription>
                Titre libre ou nom du modele, ponctuel ou jours fixes.
              </CardDescription>
            </div>
            {!showForm ? (
              <Button
                type="button"
                variant="pill"
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setFormDate(undefined)
                  setShowForm(true)
                }}
              >
                <CalendarPlus className="size-4" />
                Ajouter
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {showForm ? (
          <CardContent>
            <ScheduleSessionForm
              templates={(templates ?? []).map((template) => ({
                id: template.id,
                name: template.name,
              }))}
              initialDate={formDate}
              editing={editing}
              isPending={createSession.isPending || updateSession.isPending}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditing(null)
                setShowForm(false)
              }}
            />
          </CardContent>
        ) : null}
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Regles actives</CardTitle>
          <CardDescription>
            {(sessions ?? []).filter((session) => session.is_active).length} planification(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(sessions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune seance planifiee pour le moment.
            </p>
          ) : (
            (sessions ?? []).map((session) => (
              <div key={session.id} className={sessionListItemClass(session.is_active)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-black">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {describeScheduledSession(session)}
                      {session.workout_template?.name
                        ? ` · ${session.workout_template.name}`
                        : ''}
                    </p>
                    {session.time_local ? (
                      <p className="text-xs text-muted-foreground">
                        A {session.time_local.slice(0, 5)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => {
                        setEditing(session)
                        setShowForm(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() =>
                        void updateSession.mutateAsync({
                          id: session.id,
                          changes: { is_active: !session.is_active },
                        })
                      }
                    >
                      {session.is_active ? 'Off' : 'On'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive"
                      onClick={() => void deleteSession.mutateAsync(session.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
