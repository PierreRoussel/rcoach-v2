import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

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
import { PageHeader, Pill } from '@/design-system'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import {
  filterExercises,
  useAllExercises,
  useCreateExercise,
} from '@/hooks/useExercises'
import { EQUIPMENT, MUSCLE_GROUPS, inferExerciseMeta } from '@/lib/workout/exercise-meta'

export const Route = createFileRoute('/app/exercises/')({
  component: ExercisesPage,
})

function ExercisesPage() {
  const { data: exercises = [], isLoading, error } = useAllExercises()
  const createExercise = useCreateExercise()
  const exerciseLocale = useExerciseLocale()
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string>('all')
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState<string>('full_body')
  const [equipment, setEquipment] = useState<string>('other')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterExercises(exercises, query, muscleGroup, exerciseLocale),
    [exercises, query, muscleGroup, exerciseLocale],
  )

  const publicCount = exercises.filter((exercise) => exercise.is_public).length
  const personalCount = exercises.length - publicCount

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setFormError('Le nom est obligatoire.')
      return
    }

    const inferred = inferExerciseMeta(trimmed)

    try {
      await createExercise.mutateAsync({
        name: trimmed,
        muscle_group: muscle || inferred.muscle_group,
        equipment: equipment || inferred.equipment,
        is_public: false,
      })
      setFormSuccess(`Exercice "${trimmed}" ajoute a votre catalogue.`)
      setName('')
    } catch {
      setFormError('Impossible de creer cet exercice.')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Catalogue"
        title="Exercices"
        description="Bibliotheque complete, filtres rapides et ajout d'exercices personnels."
      />

      <div className="grid grid-cols-2 gap-3">
        <Pill tone="primary">{publicCount} publics</Pill>
        <Pill tone="purple">{personalCount} persos</Pill>
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Rechercher..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMuscleGroup('all')}>
              <Pill tone={muscleGroup === 'all' ? 'primary' : 'default'}>Tous</Pill>
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button key={group} type="button" onClick={() => setMuscleGroup(group)}>
                <Pill tone={muscleGroup === group ? 'secondary' : 'default'}>{group}</Pill>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Ajouter un exercice</CardTitle>
          <CardDescription>
            Les metadonnees sont pre-remplies depuis le nom si possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="exerciseName">Nom</Label>
              <Input
                id="exerciseName"
                value={name}
                onChange={(event) => {
                  const value = event.target.value
                  setName(value)
                  const inferred = inferExerciseMeta(value)
                  setMuscle(inferred.muscle_group)
                  setEquipment(inferred.equipment)
                }}
                placeholder="Ex: Incline Dumbbell Press"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="muscle">Muscle</Label>
                <select
                  id="muscle"
                  className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                  value={muscle}
                  onChange={(event) => setMuscle(event.target.value)}
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipement</Label>
                <select
                  id="equipment"
                  className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                  value={equipment}
                  onChange={(event) => setEquipment(event.target.value)}
                >
                  {EQUIPMENT.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" variant="pill" disabled={createExercise.isPending}>
              <Plus className="size-4" />
              {createExercise.isPending ? 'Creation...' : 'Ajouter'}
            </Button>
            {formError ? <FormMessage>{formError}</FormMessage> : null}
            {formSuccess ? (
              <p className="text-sm text-secondary-foreground">{formSuccess}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">
            {filtered.length} resultats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur de chargement'}
            </p>
          ) : null}
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {filtered.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-2xl border border-border px-3 py-2.5"
              >
                <div>
                  <p className="font-medium">
                    <DisplayExerciseName name={exercise.name} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.muscle_group ?? '—'} · {exercise.equipment ?? '—'}
                  </p>
                </div>
                {!exercise.is_public ? <Pill tone="purple">Perso</Pill> : null}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4 rounded-full" asChild>
            <Link to="/app/workout/active">Demarrer une seance</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
