import { useEffect, useState } from 'react'

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
import { templateExercisesToActive } from '@/lib/workout/template-mapper'

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
  }, [initialTemplateId, templates])

  function handleTemplateChange(nextTemplateId: string | null) {
    setTemplateId(nextTemplateId)

    if (!nextTemplateId) {
      setWorkoutTitle(getDefaultFreeWorkoutTitle())
      return
    }

    const template = templates?.find((item) => item.id === nextTemplateId)
    if (template) {
      setWorkoutTitle(template.name)
    }
  }

  async function handleStart() {
    setFormError(null)
    setIsStarting(true)

    try {
      const trimmedTitle = workoutTitle.trim()

      if (templateId && templates) {
        const template = templates.find((item) => item.id === templateId)

        if (template) {
          const draft = templateToDraft(template)
          await startWorkoutFromTemplate(
            trimmedTitle || template.name,
            templateExercisesToActive(draft.exercises),
            DEFAULT_GLOBAL_REST_SECONDS,
            template.id,
          )
          return
        }
      }

      const freeTitle =
        !trimmedTitle || isLegacyFreeWorkoutTitle(trimmedTitle)
          ? getDefaultFreeWorkoutTitle()
          : trimmedTitle

      await startWorkout(freeTitle)
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
