import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { Button } from '@/components/ui/button'
import { useExercisePickerConsumer } from '@/hooks/useExercisePickerConsumer'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader, Pill } from '@/design-system'
import { DisplayExercise } from '@/components/workout/DisplayExerciseName'
import {
  useAddProgramDay,
  useAddProgramExercise,
  useProgram,
  useRemoveProgramExercise,
} from '@/hooks/useCoach'
import type { Exercise } from '@/lib/graphql/operations'

export const Route = createFileRoute('/coach/programs/$programId')({
  component: ProgramDetailPage,
})

function ProgramDetailPage() {
  const { programId } = Route.useParams()
  const { data: program, isLoading, error } = useProgram(programId)
  const addDay = useAddProgramDay()
  const addExercise = useAddProgramExercise()
  const removeExercise = useRemoveProgramExercise()
  const [dayName, setDayName] = useState('')
  const [activeDayId, setActiveDayId] = useState<string | null>(null)

  const activeDay =
    program?.program_days.find((day) => day.id === activeDayId) ??
    program?.program_days[0] ??
    null

  async function handleAddDay() {
    if (!program || !dayName.trim()) return

    await addDay.mutateAsync({
      programId: program.id,
      name: dayName.trim(),
      sortOrder: program.program_days.length,
    })
    setDayName('')
  }

  async function handleAddExercise(exercise: Exercise) {
    if (!program || !activeDay) return

    await addExercise.mutateAsync({
      programId: program.id,
      programDayId: activeDay.id,
      exerciseId: exercise.id,
      sortOrder: activeDay.program_exercises.length,
      targetSets: 3,
      targetReps: '8-12',
    })
  }

  useExercisePickerConsumer({
    onAdd: handleAddExercise,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>
  }

  if (error || !program) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Programme introuvable.'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/coach/programs">
          <ArrowLeft className="size-4" />
          Programmes
        </Link>
      </Button>

      <PageHeader
        eyebrow="Programme"
        title={program.name}
        description={program.description ?? 'Template de séances'}
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Jours</CardTitle>
          <CardDescription>
            Organisez votre split (ex. Push A, Pull B, Legs).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {program.program_days.map((day) => (
              <Button
                key={day.id}
                variant={activeDay?.id === day.id ? 'pill' : 'soft'}
                size="sm"
                onClick={() => setActiveDayId(day.id)}
              >
                {day.name}
                <Pill tone="default">{day.program_exercises.length}</Pill>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Nom du jour (ex. Push)"
              value={dayName}
              onChange={(event) => setDayName(event.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAddDay()}
              disabled={addDay.isPending}
            >
              <Plus className="size-4" />
              Ajouter un jour
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeDay ? (
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="font-display font-black">
                  {activeDay.name}
                </CardTitle>
                <CardDescription>
                  Exercices, séries cibles et notes pour ce jour.
                </CardDescription>
              </div>
              <ExercisePicker
                context="program"
                programId={program.id}
                programDayId={activeDay.id}
                returnTo={{
                  to: '/coach/programs/$programId',
                  params: { programId: program.id },
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDay.program_exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun exercice — utilisez le bouton Ajouter.
              </p>
            ) : null}
            {activeDay.program_exercises.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div>
                  <p className="font-display font-bold">
                    <DisplayExercise exercise={entry.exercise} className="font-display font-black" />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.target_sets ?? '—'} x {entry.target_reps ?? '—'}
                    {entry.exercise.muscle_group
                      ? ` · ${entry.exercise.muscle_group}`
                      : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    void removeExercise.mutateAsync({
                      programId: program.id,
                      programExerciseId: entry.id,
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-dashed border-border">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Ajoutez un jour pour commencer a construire le programme.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
