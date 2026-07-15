import { useEffect, useState } from 'react'

import { SessionModeSelector } from '@/components/workout/SessionModeSelector'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_GLOBAL_REST_SECONDS,
  isGraphqlTemplatesMissingError,
  templateToDraft,
  useWorkoutTemplates,
} from '@/hooks/useWorkoutTemplates'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import {
  getDefaultFreeWorkoutTitle,
  isLegacyFreeWorkoutTitle,
} from '@/lib/workout/default-free-workout-title'
import {
  resolveTemplateSessionMode,
  templateExercisesToActive,
} from '@/lib/workout/template-mapper'
import {
  DEFAULT_EMOM_INTERVAL_SECONDS,
  DEFAULT_SESSION_MODE,
  normalizeSessionMode,
  type SessionMode,
} from '@/lib/workout/session-mode'
import { DEFAULT_EMOM_COUNTDOWN_SECONDS } from '@/lib/workout/emom-store'

type StartWorkoutFormProps = {
  initialTemplateId?: string
}

export function StartWorkoutForm({ initialTemplateId }: StartWorkoutFormProps) {
  const { data: templates, isLoading, error } = useWorkoutTemplates()
  const startWorkout = useActiveWorkoutStore((state) => state.startWorkout)
  const startWorkoutFromTemplate = useActiveWorkoutStore(
    (state) => state.startWorkoutFromTemplate,
  )

  const [workoutTitle, setWorkoutTitle] = useState(() => getDefaultFreeWorkoutTitle())
  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplateId ?? null,
  )
  const [sessionMode, setSessionMode] = useState<SessionMode>(DEFAULT_SESSION_MODE)
  const [emomTotalMinutes, setEmomTotalMinutes] = useState('12')
  const [emomIntervalSeconds, setEmomIntervalSeconds] = useState(
    String(DEFAULT_EMOM_INTERVAL_SECONDS),
  )
  const [emomCountdownSeconds, setEmomCountdownSeconds] = useState(
    String(DEFAULT_EMOM_COUNTDOWN_SECONDS),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const templatesMissing = isGraphqlTemplatesMissingError(error)
  const selectedTemplate = templates?.find((template) => template.id === templateId)

  useEffect(() => {
    if (!initialTemplateId || !templates?.length) {
      return
    }

    const template = templates.find((item) => item.id === initialTemplateId)
    if (!template) {
      return
    }

    setTemplateId(template.id)
    setWorkoutTitle(template.name)
    setSessionMode(resolveTemplateSessionMode(template))
    setEmomTotalMinutes(String(template.emom_total_minutes ?? 12))
    setEmomIntervalSeconds(
      String(template.emom_interval_seconds ?? DEFAULT_EMOM_INTERVAL_SECONDS),
    )
  }, [initialTemplateId, templates])

  function handleTemplateChange(nextTemplateId: string | null) {
    setTemplateId(nextTemplateId)

    if (!nextTemplateId) {
      setWorkoutTitle(getDefaultFreeWorkoutTitle())
      setSessionMode(DEFAULT_SESSION_MODE)
      setEmomTotalMinutes('12')
      setEmomIntervalSeconds(String(DEFAULT_EMOM_INTERVAL_SECONDS))
      return
    }

    const template = templates?.find((item) => item.id === nextTemplateId)
    if (template) {
      setWorkoutTitle(template.name)
      setSessionMode(resolveTemplateSessionMode(template))
      setEmomTotalMinutes(String(template.emom_total_minutes ?? 12))
      setEmomIntervalSeconds(
        String(template.emom_interval_seconds ?? DEFAULT_EMOM_INTERVAL_SECONDS),
      )
    }
  }

  function buildEmomConfig() {
    const totalMinutes = Number.parseInt(emomTotalMinutes, 10)
    const intervalSeconds = Number.parseInt(emomIntervalSeconds, 10)
    const countdownSeconds = Number.parseInt(emomCountdownSeconds, 10)

    if (!Number.isFinite(totalMinutes) || totalMinutes < 1) {
      throw new Error('Indiquez une durée EMOM valide (au moins 1 minute).')
    }

    if (!Number.isFinite(intervalSeconds) || intervalSeconds < 1) {
      throw new Error('Indiquez un intervalle EMOM valide (au moins 1 seconde).')
    }

    if (!Number.isFinite(countdownSeconds) || countdownSeconds < 0) {
      throw new Error('Indiquez un décompte valide (0 ou plus).')
    }

    return { totalMinutes, intervalSeconds, countdownSeconds }
  }

  function buildEmomStartOptions(
    intervalSeconds: number,
    totalMinutes: number,
    countdownSeconds = DEFAULT_EMOM_COUNTDOWN_SECONDS,
  ) {
    return {
      intervalSeconds,
      totalMinutes,
      countdownSeconds,
    }
  }

  async function handleStart() {
    setFormError(null)
    setIsStarting(true)

    try {
      const trimmedTitle = workoutTitle.trim()
      const normalizedSessionMode = normalizeSessionMode(sessionMode)
      const emomConfig =
        normalizedSessionMode === 'emom' ? buildEmomConfig() : undefined

      if (templateId && templates) {
        const template = templates.find((item) => item.id === templateId)

        if (template) {
          const draft = templateToDraft(template)
          const templateSessionMode = resolveTemplateSessionMode(template)
          await startWorkoutFromTemplate(
            trimmedTitle || template.name,
            templateExercisesToActive(draft.exercises, templateSessionMode),
            template.default_rest_seconds ?? DEFAULT_GLOBAL_REST_SECONDS,
            template.id,
            {
              sessionMode: templateSessionMode,
              emom:
                templateSessionMode === 'emom'
                  ? buildEmomStartOptions(
                      template.emom_interval_seconds ??
                        emomConfig?.intervalSeconds ??
                        DEFAULT_EMOM_INTERVAL_SECONDS,
                      template.emom_total_minutes ??
                        emomConfig?.totalMinutes ??
                        12,
                      emomConfig?.countdownSeconds ?? DEFAULT_EMOM_COUNTDOWN_SECONDS,
                    )
                  : undefined,
            },
          )
          return
        }
      }

      const freeTitle =
        !trimmedTitle || isLegacyFreeWorkoutTitle(trimmedTitle)
          ? getDefaultFreeWorkoutTitle()
          : trimmedTitle

      await startWorkout(freeTitle, {
        sessionMode: normalizedSessionMode,
        emom: emomConfig,
      })
    } catch (startError) {
      setFormError(
        startError instanceof Error
          ? startError.message
          : 'Impossible de démarrer la séance.',
      )
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="font-display font-black">Démarrer</CardTitle>
        <CardDescription>
          Séance libre ou a partir d&apos;un modèle pre-construit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SessionModeSelector value={sessionMode} onChange={setSessionMode} />

        {sessionMode === 'emom' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emomTotalMinutes">Durée totale (minutes)</Label>
              <Input
                id="emomTotalMinutes"
                type="number"
                min={1}
                inputMode="numeric"
                value={emomTotalMinutes}
                onChange={(event) => setEmomTotalMinutes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emomIntervalSeconds">Intervalle (secondes)</Label>
              <Input
                id="emomIntervalSeconds"
                type="number"
                min={1}
                inputMode="numeric"
                value={emomIntervalSeconds}
                onChange={(event) => setEmomIntervalSeconds(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emomCountdownSeconds">Décompte initial (secondes)</Label>
              <select
                id="emomCountdownSeconds"
                className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={emomCountdownSeconds}
                onChange={(event) => setEmomCountdownSeconds(event.target.value)}
              >
                <option value="0">Aucun</option>
                <option value="3">3-2-1</option>
                <option value="10">10 secondes</option>
              </select>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="workoutTitle">Titre</Label>
          <Input
            id="workoutTitle"
            value={workoutTitle}
            onChange={(event) => setWorkoutTitle(event.target.value)}
            placeholder={
              selectedTemplate
                ? `Par défaut : ${selectedTemplate.name}`
                : getDefaultFreeWorkoutTitle()
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workoutTemplate">Modèle (optionnel)</Label>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des modèles...</p>
          ) : (
            <select
              id="workoutTemplate"
              className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
              value={templateId ?? ''}
              onChange={(event) =>
                handleTemplateChange(event.target.value || null)
              }
              disabled={Boolean(error)}
            >
              <option value="">Séance libre (sans modèle)</option>
              {(templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.workout_template_exercises.length} exo)
                  {template.session_mode === 'emom' ? ' · EMOM' : ''}
                </option>
              ))}
            </select>
          )}
          {templatesMissing ? (
            <p className="text-xs text-muted-foreground">
              Modèles indisponibles — redéployez Nhost (migration workout_templates).
            </p>
          ) : null}
          {error && !templatesMissing ? (
            <p className="text-xs text-destructive">
              {error instanceof Error ? error.message : 'Erreur de chargement'}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="pill"
          disabled={isStarting}
          onClick={() => void handleStart()}
        >
          {isStarting ? 'Démarrage...' : 'Démarrer'}
        </Button>

        {formError ? <FormMessage>{formError}</FormMessage> : null}
      </CardContent>
    </Card>
  )
}
