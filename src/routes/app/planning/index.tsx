import { createFileRoute, Link } from '@tanstack/react-router'
import { parseISO } from 'date-fns'
import { ArrowLeft, CalendarPlus, Flame, ListChecks } from 'lucide-react'
import { useState } from 'react'

import { WorkoutCalendarPanel } from '@/components/schedule/CalendarDayDetail'
import { ScheduledSessionRow } from '@/components/schedule/ScheduledSessionRow'
import {
  ScheduleSessionForm,
  type ScheduleFormValues,
} from '@/components/schedule/ScheduleSessionForm'
import { Button } from '@/components/ui/button'
import { PageHeader, Pill } from '@/design-system'
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

import type { PlanningSearchParams } from '@/lib/schedule/planning-navigation'

export const Route = createFileRoute('/app/planning/')({
  validateSearch: (search: Record<string, unknown>): PlanningSearchParams => {
    const params: PlanningSearchParams = {}

    const date =
      typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined

    if (date) {
      params.date = date
    }

    if (typeof search.templateId === 'string' && search.templateId.trim()) {
      params.templateId = search.templateId.trim()
    }

    if (typeof search.title === 'string' && search.title.trim()) {
      params.title = search.title.trim()
    }

    if (search.schedule === true || search.schedule === 'true' || search.schedule === '1') {
      params.schedule = true
    }

    return params
  },
  component: PlanningPage,
})

function PlanningPage() {
  const {
    date: initialDateParam,
    templateId: initialTemplateId,
    title: initialTitle,
    schedule: openScheduleForm,
  } = Route.useSearch()
  const initialDate = initialDateParam
    ? parseISO(`${initialDateParam}T12:00:00`)
    : undefined

  const { markers, weeklyStreak, isLoading, error, scheduleMissing } =
    useCalendarData()
  const { data: sessionsResult } = useScheduledSessions({ includeInactive: true })
  const sessions = sessionsResult?.sessions ?? []
  const activeCount = sessions.filter((session) => session.is_active).length
  const { data: templates } = useWorkoutTemplates()
  const createSession = useCreateScheduledSession()
  const updateSession = useUpdateScheduledSession()
  const deleteSession = useDeleteScheduledSession()
  const { startPlannedSession, isStarting } = useStartPlannedSession()

  const [editing, setEditing] = useState<ScheduledSessionRecord | null>(null)
  const [showForm, setShowForm] = useState(Boolean(initialDate || openScheduleForm))
  const [formDate, setFormDate] = useState<Date | undefined>(initialDate)

  function openPlanForm(date: Date) {
    setEditing(null)
    setFormDate(date)
    setShowForm(true)
  }

  function closeForm() {
    setEditing(null)
    setShowForm(false)
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
      closeForm()
      return
    }

    await createSession.mutateAsync(payload)
    closeForm()
  }

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-full" asChild>
        <Link to="/app/stats">
          <ArrowLeft className="size-4" />
          Stats
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-soft-purple/45 via-card to-soft-primary/25 px-5 py-6 shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
        <PageHeader
          eyebrow="Planning"
          title="Calendrier d entrainement"
          description="Visualisez vos seances, planifiez les prochaines et suivez votre regularite."
          className="relative"
        />
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Pill tone="accent">
            <Flame className="size-3" />
            {weeklyStreak} sem. de suite
          </Pill>
          <Pill tone="secondary">
            <ListChecks className="size-3" />
            {activeCount} regle{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
          </Pill>
        </div>
      </section>

      {scheduleMissing ? (
        <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {SCHEDULE_NOT_DEPLOYED_MESSAGE} Le calendrier affiche deja vos seances realisees.
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du calendrier...</p>
      ) : null}

      {error && !scheduleMissing ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="font-display text-lg font-black">Calendrier</h2>
            <p className="text-xs text-muted-foreground">
              Touchez un jour pour le detail et demarrer une seance.
            </p>
          </div>
          {!showForm ? (
            <Button
              type="button"
              variant="pill"
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => {
                setEditing(null)
                setFormDate(undefined)
                setShowForm(true)
              }}
            >
              <CalendarPlus className="size-4" />
              Planifier
            </Button>
          ) : null}
        </div>

        <WorkoutCalendarPanel
          markers={markers}
          mode="full"
          streak={weeklyStreak}
          onStartPlanned={(occurrence) => void startPlannedSession(occurrence)}
          onPlanDate={openPlanForm}
          isStarting={isStarting}
        />
      </section>

      {showForm ? (
        <section className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-sm ring-1 ring-primary/10">
          <div>
            <h2 className="font-display text-lg font-black">
              {editing ? 'Modifier la planification' : 'Nouvelle planification'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Titre libre ou modele, ponctuel ou jours fixes de la semaine.
            </p>
          </div>
          <ScheduleSessionForm
            key={`${editing?.id ?? 'new'}-${initialTemplateId ?? 'none'}-${initialTitle ?? ''}`}
            templates={(templates ?? []).map((template) => ({
              id: template.id,
              name: template.name,
            }))}
            initialDate={formDate}
            initialTemplateId={editing ? undefined : initialTemplateId}
            initialTitle={editing ? undefined : initialTitle}
            editing={editing}
            isPending={createSession.isPending || updateSession.isPending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="font-display text-lg font-black">Regles de planification</h2>
          <p className="text-xs text-muted-foreground">
            {sessions.length} entree{sessions.length > 1 ? 's' : ''} au total
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune seance planifiee. Ajoutez votre premiere regle.
            </p>
            {!showForm ? (
              <Button
                type="button"
                variant="soft"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => setShowForm(true)}
              >
                <CalendarPlus className="size-4" />
                Creer une planification
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((session) => (
              <ScheduledSessionRow
                key={session.id}
                session={session}
                onEdit={() => {
                  setEditing(session)
                  setShowForm(true)
                }}
                onToggleActive={(active) =>
                  void updateSession.mutateAsync({
                    id: session.id,
                    changes: { is_active: active },
                  })
                }
                onDelete={() => void deleteSession.mutateAsync(session.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
