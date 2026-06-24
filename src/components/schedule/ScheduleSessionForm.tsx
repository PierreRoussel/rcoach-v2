import { format } from 'date-fns'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScheduledSessionRecord } from '@/lib/graphql/operations'
import { resolveScheduleTitle } from '@/lib/schedule/resolve-schedule-title'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 7, label: 'Dim' },
] as const

export type ScheduleFormValues = {
  title: string
  workoutTemplateId: string | null
  workoutTemplateIdB: string | null
  recurrenceType: 'once' | 'weekly' | 'aba'
  weekdays: number[]
  scheduledDate: string
  startDate: string
  endDate: string
  timeLocal: string
}

type ScheduleSessionFormProps = {
  templates: Array<{ id: string; name: string }>
  initialDate?: Date
  initialTemplateId?: string | null
  initialTitle?: string
  editing?: ScheduledSessionRecord | null
  isPending?: boolean
  onSubmit: (values: ScheduleFormValues) => Promise<void>
  onCancel?: () => void
}

function defaultValues(
  initialDate?: Date,
  editing?: ScheduledSessionRecord | null,
  initialTemplateId?: string | null,
  initialTitle?: string,
): ScheduleFormValues {
  const today = initialDate ?? new Date()

  if (editing) {
    return {
      title: editing.title,
      workoutTemplateId: editing.workout_template_id,
      workoutTemplateIdB: editing.workout_template_id_b ?? null,
      recurrenceType: editing.recurrence_type,
      weekdays: editing.weekdays ?? [],
      scheduledDate: editing.scheduled_date ?? format(today, 'yyyy-MM-dd'),
      startDate: editing.start_date,
      endDate: editing.end_date ?? '',
      timeLocal: editing.time_local?.slice(0, 5) ?? '',
    }
  }

  return {
    title: initialTitle ?? '',
    workoutTemplateId: initialTemplateId ?? null,
    workoutTemplateIdB: null,
    recurrenceType: 'once',
    weekdays: [],
    scheduledDate: format(today, 'yyyy-MM-dd'),
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: '',
    timeLocal: '',
  }
}

export function ScheduleSessionForm({
  templates,
  initialDate,
  initialTemplateId,
  initialTitle,
  editing,
  isPending = false,
  onSubmit,
  onCancel,
}: ScheduleSessionFormProps) {
  const [values, setValues] = useState<ScheduleFormValues>(() =>
    defaultValues(initialDate, editing, initialTemplateId, initialTitle),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(defaultValues(initialDate, editing, initialTemplateId, initialTitle))
  }, [initialDate, editing, initialTemplateId, initialTitle])

  const isRecurring =
    values.recurrenceType === 'weekly' || values.recurrenceType === 'aba'
  const isAba = values.recurrenceType === 'aba'

  function toggleWeekday(day: number) {
    setValues((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day].sort((left, right) => left - right),
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const resolvedTitle = resolveScheduleTitle(
      {
        title: values.title,
        workoutTemplateId: values.workoutTemplateId,
        workoutTemplateIdB: values.workoutTemplateIdB,
        recurrenceType: values.recurrenceType,
      },
      templates,
    )

    if (!resolvedTitle && !isAba) {
      setError('Indiquez un titre ou selectionnez un modele.')
      return
    }

    if (isRecurring && values.weekdays.length === 0) {
      setError('Selectionnez au moins un jour.')
      return
    }

    if (isAba) {
      if (!values.workoutTemplateId || !values.workoutTemplateIdB) {
        setError('Selectionnez les deux modeles A et B.')
        return
      }

      if (values.workoutTemplateId === values.workoutTemplateIdB) {
        setError('Les deux modeles doivent etre differents.')
        return
      }
    }

    try {
      await onSubmit({
        ...values,
        title:
          resolvedTitle ||
          `${templates.find((entry) => entry.id === values.workoutTemplateId)?.name ?? 'A'} / ${
            templates.find((entry) => entry.id === values.workoutTemplateIdB)?.name ?? 'B'
          }`,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Impossible d enregistrer la planification.',
      )
    }
  }

  const selectedTemplate = templates.find(
    (template) => template.id === values.workoutTemplateId,
  )

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <div className="space-y-3 rounded-2xl bg-muted/25 p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Seance
        </p>
        <div className="space-y-2">
          <Label htmlFor="scheduleTitle">
            Titre{selectedTemplate && !isAba ? ' (optionnel)' : isAba ? ' (optionnel)' : ''}
          </Label>
          <Input
            id="scheduleTitle"
            value={values.title}
            onChange={(event) =>
              setValues((current) => ({ ...current, title: event.target.value }))
            }
            placeholder={
              isAba
                ? 'Par defaut : Push / Pull'
                : selectedTemplate
                  ? `Par defaut : ${selectedTemplate.name}`
                  : 'Push, Legs, Cardio...'
            }
          />
        </div>

        {isAba ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduleTemplateA">Modele A</Label>
              <select
                id="scheduleTemplateA"
                className="flex h-10 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={values.workoutTemplateId ?? ''}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    workoutTemplateId: event.target.value || null,
                  }))
                }
              >
                <option value="">Choisir le modele A</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduleTemplateB">Modele B</Label>
              <select
                id="scheduleTemplateB"
                className="flex h-10 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={values.workoutTemplateIdB ?? ''}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    workoutTemplateIdB: event.target.value || null,
                  }))
                }
              >
                <option value="">Choisir le modele B</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="scheduleTemplate">Modele (optionnel)</Label>
            <select
              id="scheduleTemplate"
              className="flex h-10 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
              value={values.workoutTemplateId ?? ''}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  workoutTemplateId: event.target.value || null,
                }))
              }
            >
              <option value="">Aucun modele</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl bg-muted/25 p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Recurrence
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            size="sm"
            variant={values.recurrenceType === 'once' ? 'pill' : 'outline'}
            className="rounded-full px-2"
            onClick={() =>
              setValues((current) => ({
                ...current,
                recurrenceType: 'once',
                workoutTemplateIdB: null,
              }))
            }
          >
            Une fois
          </Button>
          <Button
            type="button"
            size="sm"
            variant={values.recurrenceType === 'weekly' ? 'pill' : 'outline'}
            className="rounded-full px-2"
            onClick={() =>
              setValues((current) => ({
                ...current,
                recurrenceType: 'weekly',
                workoutTemplateIdB: null,
              }))
            }
          >
            Hebdo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={values.recurrenceType === 'aba' ? 'pill' : 'outline'}
            className="rounded-full px-2"
            onClick={() =>
              setValues((current) => ({
                ...current,
                recurrenceType: 'aba',
              }))
            }
          >
            ABA
          </Button>
        </div>

        {isAba ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Alterne les modeles A et B sur les jours choisis, sans rupture de
            sequence (ABABAB...).
          </p>
        ) : null}

        {values.recurrenceType === 'once' ? (
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              className="h-10"
              value={values.scheduledDate}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  scheduledDate: event.target.value,
                  startDate: event.target.value,
                }))
              }
            />
          </div>
        ) : isRecurring ? (
          <>
            <div className="space-y-2">
              <Label>Jours</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAY_LABELS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={values.weekdays.includes(day.value) ? 'pill' : 'outline'}
                    className="rounded-full px-0"
                    onClick={() => toggleWeekday(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Debut</Label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-10"
                  value={values.startDate}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fin (optionnel)</Label>
                <Input
                  id="endDate"
                  type="date"
                  className="h-10"
                  value={values.endDate}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-2 rounded-2xl bg-muted/25 p-4">
        <Label htmlFor="timeLocal">Heure (optionnel)</Label>
        <Input
          id="timeLocal"
          type="time"
          className="h-10"
          value={values.timeLocal}
          onChange={(event) =>
            setValues((current) => ({ ...current, timeLocal: event.target.value }))
          }
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="pill" disabled={isPending}>
          {isPending ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Planifier'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export function describeScheduledSession(session: ScheduledSessionRecord): string {
  if (session.recurrence_type === 'once') {
    return `Le ${session.scheduled_date ?? session.start_date}`
  }

  const labels = WEEKDAY_LABELS.filter((day) =>
    session.weekdays?.includes(day.value),
  )
    .map((day) => day.label)
    .join(', ')

  if (session.recurrence_type === 'aba') {
    const nameA = session.workout_template?.name ?? 'A'
    const nameB = session.workout_template_b?.name ?? 'B'
    return `Alterne ${labels || 'chaque semaine'} · ${nameA} / ${nameB}`
  }

  return `Chaque ${labels || 'semaine'}`
}

export function sessionListItemClass(active: boolean) {
  return cn(
    'rounded-2xl border px-4 py-3',
    active ? 'border-border bg-card' : 'border-dashed border-border/70 bg-muted/20 opacity-70',
  )
}
