import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill } from '@/design-system'
import { filterExercises, useAllExercises } from '@/hooks/useExercises'
import type { ExerciseCatalogEntry } from '@/lib/stats/exercise-progression'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import { MUSCLE_GROUPS } from '@/lib/workout/exercise-meta'
import { exerciseNameMatchesQuery } from '@/lib/workout/translate-exercise-name'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type ExerciseSearchDrawerProps = {
  catalog: ExerciseCatalogEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DrawerRow = {
  exerciseId: string
  name: string
  nameFr?: string | null
  muscleGroup: string | null
  sessionCount: number
  currentPerformance: string | null
}

export function ExerciseSearchDrawer({
  catalog,
  open,
  onOpenChange,
}: ExerciseSearchDrawerProps) {
  const navigate = useNavigate()
  const { data: allExercises = [], isLoading } = useAllExercises()
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string>('all')

  const rows = useMemo(() => {
    const fromCatalog = catalog.map<DrawerRow>((entry) => {
      const exercise = allExercises.find((item) => item.id === entry.exerciseId)
      return {
        exerciseId: entry.exerciseId,
        name: exercise?.name ?? entry.name,
        nameFr: exercise?.name_fr ?? null,
        muscleGroup: entry.muscleGroup,
        sessionCount: entry.sessionCount,
        currentPerformance: entry.currentPerformance,
      }
    })

    const catalogIds = new Set(fromCatalog.map((entry) => entry.exerciseId))
    const extras = filterExercises(allExercises, query, muscleGroup)
      .filter((exercise) => !catalogIds.has(exercise.id))
      .map<DrawerRow>((exercise) => ({
        exerciseId: exercise.id,
        name: exercise.name,
        nameFr: exercise.name_fr ?? null,
        muscleGroup: exercise.muscle_group,
        sessionCount: 0,
        currentPerformance: null,
      }))

    const filteredCatalog =
      query.trim() || muscleGroup !== 'all'
        ? fromCatalog.filter((entry) => {
            if (muscleGroup !== 'all') {
              const normalizedGroup = entry.muscleGroup?.toLowerCase()
              if (normalizedGroup !== muscleGroup) {
                return false
              }
            }

            return exerciseNameMatchesQuery(
              { name: entry.name, name_fr: entry.nameFr },
              query,
            )
          })
        : fromCatalog

    return [...filteredCatalog, ...extras].sort((left, right) => {
      if (right.sessionCount !== left.sessionCount) {
        return right.sessionCount - left.sessionCount
      }

      return left.name.localeCompare(right.name, 'fr')
    })
  }, [allExercises, catalog, muscleGroup, query])

  function handleSelect(exerciseId: string) {
    onOpenChange(false)
    void navigate({
      to: '/app/stats/exercises/$exerciseId',
      params: { exerciseId },
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-3xl px-0">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle className="font-display font-black">Choisir un exercice</DrawerTitle>
          <DrawerDescription>
            Les plus fréquents en premier, puis le catalogue complet.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 px-4 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un exercice..."
              className="h-10 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={muscleGroup === 'all' ? 'pill' : 'outline'}
              className="rounded-full"
              onClick={() => setMuscleGroup('all')}
            >
              Tous
            </Button>
            {MUSCLE_GROUPS.map((group) => (
              <Button
                key={group}
                type="button"
                size="sm"
                variant={muscleGroup === group ? 'pill' : 'outline'}
                className="rounded-full"
                onClick={() => setMuscleGroup(group)}
              >
                {MUSCLE_GROUP_LABELS[group]}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-y-auto px-2 pb-6">
          {isLoading ? (
            <p className="px-2 text-sm text-muted-foreground">Chargement...</p>
          ) : rows.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">Aucun exercice trouvé.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((row) => (
                <li key={row.exerciseId}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/30"
                    onClick={() => handleSelect(row.exerciseId)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold">
                        <DisplayExerciseName name={row.name} nameFr={row.nameFr} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {MUSCLE_GROUP_LABELS[normalizeMuscleGroup(row.muscleGroup)]}
                        {row.sessionCount > 0
                          ? ` · ${row.sessionCount} séance${row.sessionCount > 1 ? 's' : ''}`
                          : ' · jamais réalisé'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row.currentPerformance ? (
                        <span className="max-w-[7rem] truncate font-data text-[10px] text-muted-foreground">
                          {row.currentPerformance}
                        </span>
                      ) : null}
                      {row.sessionCount > 0 ? (
                        <Pill tone="secondary" className="py-0.5 text-[0.6rem]">
                          Frequent
                        </Pill>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
