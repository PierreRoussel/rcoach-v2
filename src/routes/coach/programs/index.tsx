import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Pill } from '@/design-system'
import { useCoachPrograms, useCreateProgram } from '@/hooks/useCoach'

export const Route = createFileRoute('/coach/programs/')({
  component: CoachProgramsPage,
})

function CoachProgramsPage() {
  const { data: programs, isLoading, error } = useCoachPrograms()
  const createProgram = useCreateProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleCreate() {
    setSuccessMessage(null)
    setFormError(null)
    if (!name.trim()) {
      setFormError('Nom du programme requis.')
      return
    }

    try {
      await createProgram.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isTemplate: true,
      })
      setName('')
      setDescription('')
      setSuccessMessage('Programme créé.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Impossible de créer le programme.',
      )
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Programmes"
        description="Créez des templates de séances avec jours et exercices cibles."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">
            Nouveau programme
          </CardTitle>
          <CardDescription>
            Ajoutez ensuite des jours (Push, Pull, Legs...) et des exercices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="programName">Nom</Label>
            <Input
              id="programName"
              placeholder="Upper / Lower 4x"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="programDescription">Description</Label>
            <Input
              id="programDescription"
              placeholder="Optionnel"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button
            variant="pill"
            onClick={() => void handleCreate()}
            disabled={createProgram.isPending}
          >
            <Plus className="size-4" />
            {createProgram.isPending ? 'Création...' : 'Créer'}
          </Button>
          {successMessage ? (
            <FeedbackMessage variant="success">{successMessage}</FeedbackMessage>
          ) : null}
          {formError ? <FeedbackMessage variant="error">{formError}</FeedbackMessage> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Bibliothèque</CardTitle>
          <CardDescription>
            {programs?.length ?? 0} programme(s) template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur'}
            </p>
          ) : null}
          {programs?.map((program) => (
            <Link
              key={program.id}
              to="/coach/programs/$programId"
              params={{ programId: program.id }}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-soft-accent/40"
            >
              <div>
                <p className="font-display font-black">{program.name}</p>
                <p className="text-sm text-muted-foreground">
                  {program.description ?? 'Sans description'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="primary">
                  <CalendarDays className="size-3" />
                  {program.program_days.length} jour(s)
                </Pill>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
