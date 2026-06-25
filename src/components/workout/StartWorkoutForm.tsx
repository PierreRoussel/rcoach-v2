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

  const [workoutTitle, setWorkoutTitle] = useState('Seance libre')
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
      const trimmedTitle = workoutTitle.trim() || 'Seance libre'

      if (templateId && templates) {
        const template = templates.find((item) => item.id === templateId)

        if (template) {
          const draft = templateToDraft(template)
          await startWorkoutFromTemplate(
            trimmedTitle,
            templateExercisesToActive(draft.exercises),
            DEFAULT_GLOBAL_REST_SECONDS,
            template.id,
          )
          return
        }
      }

      await startWorkout(trimmedTitle)
    } catch (startError) {
      setFormError(
        startError instanceof Error
          ? startError.message
          : 'Impossible de demarrer la seance.',
      )
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="font-display font-black">Demarrer</CardTitle>
        <CardDescription>
          Seance libre ou a partir d&apos;un modele pre-construit.
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
                ? `Par defaut : ${selectedTemplate.name}`
                : 'Seance libre, Push, Legs...'
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workoutTemplate">Modele (optionnel)</Label>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des modeles...</p>
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
              <option value="">Seance libre (sans modele)</option>
              {(templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.workout_template_exercises.length} exo)
                </option>
              ))}
            </select>
          )}
          {templatesMissing ? (
            <p className="text-xs text-muted-foreground">
              Modeles indisponibles — redeployez Nhost (migration workout_templates).
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
          {isStarting ? 'Demarrage...' : 'Demarrer'}
        </Button>

        {formError ? <FormMessage>{formError}</FormMessage> : null}
      </CardContent>
    </Card>
  )
}
