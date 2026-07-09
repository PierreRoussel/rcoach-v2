import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { parseISO } from 'date-fns'
import { ArrowLeft, CalendarDays, CalendarPlus } from 'lucide-react'
import { useRef, useState } from 'react'

import { WorkoutCalendarPanel } from '@/components/schedule/CalendarDayDetail'
import { PlanningStreakBar } from '@/components/schedule/PlanningStreakBar'
import { ScheduleDeployNotice } from '@/components/schedule/ScheduleDeployNotice'
import { ScheduledSessionRow } from '@/components/schedule/ScheduledSessionRow'
import {
  ScheduleSessionForm,
  type ScheduleFormValues,
} from '@/components/schedule/ScheduleSessionForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/design-system'
import { useEntitlement } from '@/hooks/useSubscription'
import {
  useCreateScheduledSession,
  useDeleteScheduledSession,
  useScheduledSessions,
  useUpdateScheduledSession,
} from '@/hooks/useScheduledSessions'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { resolveScheduleTitle } from '@/lib/schedule/resolve-schedule-title'
import type { ScheduledSessionRecord } from '@/lib/graphql/operations'
import { FREE_ACTIVE_PROGRAMS } from '@/lib/subscription/entitlements'
import { UpgradePrompt } from '@/components/subscription/PremiumGate'

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
  const navigate = useNavigate({ from: Route.fullPath })
  const {
    date: initialDateParam,
    templateId: initialTemplateId,
    title: initialTitle,
    schedule: openScheduleForm,
  } = Route.useSearch()
  const initialDate = initialDateParam
    ? parseISO(`${initialDateParam}T12:00:00`)
    : undefined

  const { data: sessionsResult, isLoading: sessionsLoading, error: sessionsError } =
    useScheduledSessions({ includeInactive: true })
  const sessions = sessionsResult?.sessions ?? []
  const scheduleMissing = sessionsResult ? !sessionsResult.deployed : false
  const activeCount = sessions.filter((session) => session.is_active).length
  const { data: templates } = useWorkoutTemplates()
  const createSession = useCreateScheduledSession()
  const updateSession = useUpdateScheduledSession()
  const deleteSession = useDeleteScheduledSession()
  const { startPlannedSession, isStarting } = useStartPlannedSession()
  const { entitled: hasUnlimitedPlanning } = useEntitlement('unlimited_planning')

  const [editing, setEditing] = useState<ScheduledSessionRecord | null>(null)
  const [showForm, setShowForm] = useState(Boolean(initialDate || openScheduleForm))
  const [formDate, setFormDate] = useState<Date | undefined>(initialDate)
  const rulesSectionRef = useRef<HTMLElement>(null)

  function scrollToPlanningRules() {
    rulesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openPlanForm(date: Date) {
    if (!hasUnlimitedPlanning && activeCount >= FREE_ACTIVE_PROGRAMS) {
      return
    }
    setEditing(null)
    setFormDate(date)
    setShowForm(true)
  }

  function closeForm() {
    setEditing(null)
    setShowForm(false)
    setFormDate(undefined)
    void navigate({ search: {}, replace: true, viewTransition: false })
  }

  async function handleSubmit(values: ScheduleFormValues) {
    const templateOptions = (templates ?? []).map((template) => ({
      id: template.id,
      name: template.name,
    }))
    const title = resolveScheduleTitle(
      {
        title: values.title,
        workoutTemplateId: values.workoutTemplateId,
        workoutTemplateIdB: values.workoutTemplateIdB,
        recurrenceType: values.recurrenceType,
      },
      templateOptions,
    )

    const isRecurring =
      values.recurrenceType === 'weekly' || values.recurrenceType === 'aba'

    const payload = {
      title,
      workout_template_id: values.workoutTemplateId,
      workout_template_id_b:
        values.recurrenceType === 'aba' ? values.workoutTemplateIdB : null,
      recurrence_type: values.recurrenceType,
      weekdays: isRecurring ? values.weekdays : null,
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
    <div className="space-y-4 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-full" asChild>
        <Link to="/app">
          <ArrowLeft className="size-4" />
          Accueil
        </Link>
      </Button>

      <PageHeader
        eyebrow="Planning"
        title="Mon calendrier"
        description="Séances, nutrition et régularité — tout au même endroit."
      />

      <PlanningStreakBar
        activePlanningCount={sessionsLoading ? undefined : activeCount}
        onPlanningClick={scrollToPlanningRules}
      />

      {scheduleMissing ? <ScheduleDeployNotice /> : null}

      {!hasUnlimitedPlanning && activeCount >= FREE_ACTIVE_PROGRAMS ? (
        <UpgradePrompt
          title="Programmes illimités"
          description={`Le plan Gratuit permet ${FREE_ACTIVE_PROGRAMS} programme actif. Passez en Premium pour planifier sans limite.`}
        />
      ) : null}

      {sessionsLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du calendrier...</p>
      ) : null}

      {sessionsError && !scheduleMissing ? (
        <p className="text-sm text-destructive">
          {sessionsError instanceof Error ? sessionsError.message : 'Erreur de chargement'}
        </p>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Vue du mois</CardTitle>
          <CardDescription>
            Touchez un jour pour voir sport et nutrition. Les pastilles vertes indiquent
            l&apos;objectif calorique.
          </CardDescription>
          <CardAction>
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
          </CardAction>
        </CardHeader>
        <CardContent className="pt-0">
          <WorkoutCalendarPanel
            mode="full"
            hideCalendarStreak
            onStartPlanned={(occurrence) => void startPlannedSession(occurrence)}
            onPlanDate={openPlanForm}
            isStarting={isStarting}
          />
        </CardContent>
      </Card>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            closeForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="font-display font-black">
              {editing ? 'Modifier la planification' : 'Planifier une séance'}
            </DialogTitle>
            <DialogDescription>
              Ponctuelle, hebdomadaire ou alternance ABA — avec ou sans modèle.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
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
          </div>
        </DialogContent>
      </Dialog>

      <section ref={rulesSectionRef} className="scroll-mt-20">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Planifications sport</CardTitle>
            <CardDescription>
              Règles récurrentes ou séances ponctuelles — actives ou en pause.
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => {
                  setEditing(null)
                  setFormDate(undefined)
                  setShowForm(true)
                }}
              >
                <CalendarPlus className="size-4" />
                Ajouter
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
                <CalendarDays className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Aucune séance planifiée. Créez une règle ou choisissez un jour dans le calendrier.
                </p>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={() => {
                    setEditing(null)
                    setFormDate(undefined)
                    setShowForm(true)
                  }}
                >
                  <CalendarPlus className="size-4" />
                  Créer une planification
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((session) => (
                  <ScheduledSessionRow
                    key={session.id}
                    session={session}
                    onEdit={() => {
                      setEditing(session)
                      setFormDate(undefined)
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
