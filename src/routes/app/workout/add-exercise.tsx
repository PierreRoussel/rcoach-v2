import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { CreateExerciseDialog } from '@/components/workout/CreateExerciseDialog'
import { ExerciseDetailDrawer } from '@/components/workout/ExerciseDetailDrawer'
import {
  ExerciseSearchList,
  exerciseToDetailTarget,
  type ExerciseQuickAddState,
} from '@/components/workout/ExerciseSearchList'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Pill } from '@/design-system'
import { useAddProgramExercise, useProgram } from '@/hooks/useCoach'
import { filterExercises, useAllExercises } from '@/hooks/useExercises'
import {
  cancelExerciseAddNavigation,
  handleExerciseAddPageBack,
  navigateExerciseAddBack,
  useExerciseAddBackNavigation,
} from '@/hooks/useExerciseAddBackNavigation'
import { useRecentExercises } from '@/hooks/useRecentExercises'
import type { Exercise } from '@/lib/graphql/operations'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { MUSCLE_GROUPS } from '@/lib/workout/exercise-meta'
import {
  addPendingExercise,
  completeExercisePicker,
  excludeExerciseFromPicker,
  getExercisePickerSession,
  peekExercisePickerExcludeIds,
  type ExercisePickerReturnTo,
} from '@/lib/workout/exercise-picker-session'

const addExerciseSearchSchema = z.object({
  context: z.enum(['active', 'template', 'program', 'replace']).optional(),
})

const SEARCH_MIN_LENGTH = 2
const QUICK_ADD_SUCCESS_MS = 1500

export const Route = createFileRoute('/app/workout/add-exercise')({
  validateSearch: addExerciseSearchSchema,
  component: AddExercisePage,
})

function AddExercisePage() {
  const navigate = useNavigate()
  const { context } = Route.useSearch()
  const session = getExercisePickerSession()
  const hadSessionRef = useRef(Boolean(session))
  const returnToRef = useRef<ExercisePickerReturnTo | undefined>(session?.returnTo)
  const didInitialSyncRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const quickAddResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string>('all')
  const [excludeIds, setExcludeIds] = useState<string[]>(session?.excludeIds ?? [])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [quickAddState, setQuickAddState] = useState<ExerciseQuickAddState>(null)
  const [feedback, setFeedback] = useState<{
    text: string
    variant: 'success' | 'error'
  } | null>(null)
  const [programAddCount, setProgramAddCount] = useState(0)

  const addExerciseToStore = useActiveWorkoutStore((state) => state.addExercise)
  const replaceExerciseInStore = useActiveWorkoutStore((state) => state.replaceExercise)
  const addProgramExercise = useAddProgramExercise()

  const programId = session?.programId
  const { data: program } = useProgram(programId ?? '')

  useExerciseAddBackNavigation()

  const { data: allExercises = [], isLoading } = useAllExercises()
  const { data: recentExercises = [] } = useRecentExercises(20)

  useEffect(() => {
    const currentSession = getExercisePickerSession()

    if (currentSession) {
      hadSessionRef.current = true
      returnToRef.current = currentSession.returnTo

      if (!didInitialSyncRef.current) {
        didInitialSyncRef.current = true
        setExcludeIds(currentSession.excludeIds)
        searchInputRef.current?.focus()
      }

      return
    }

    if (hadSessionRef.current) {
      return
    }

    if (context === 'template') {
      void navigate({
        to: '/app/sessions',
        search: { tab: 'catalog' },
        replace: true,
        viewTransition: false,
      })
      return
    }

    if (context === 'program') {
      void navigate({ to: '/coach/programs', replace: true, viewTransition: false })
      return
    }

    void navigate({ to: '/app/workout/active', replace: true, viewTransition: false })
  }, [context, navigate])

  useEffect(() => {
    return () => {
      clearQuickAddResetTimer()
    }
  }, [])

  const trimmedQuery = query.trim()
  const isSearchMode = trimmedQuery.length >= SEARCH_MIN_LENGTH

  const filteredExercises = useMemo(
    () =>
      filterExercises(allExercises, query, muscleGroup).filter(
        (exercise) => !excludeIds.includes(exercise.id),
      ),
    [allExercises, query, muscleGroup, excludeIds],
  )

  const recentRows = useMemo(() => {
    if (isSearchMode) {
      return []
    }

    const recentIds = new Set(recentExercises.map((exercise) => exercise.id))
    return filterExercises(recentExercises, query, muscleGroup).filter(
      (exercise) => !excludeIds.includes(exercise.id) && recentIds.has(exercise.id),
    )
  }, [recentExercises, query, muscleGroup, excludeIds, isSearchMode])

  const catalogRows = useMemo(() => {
    if (isSearchMode) {
      return filteredExercises
    }

    const recentIdSet = new Set(recentRows.map((exercise) => exercise.id))
    return filteredExercises.filter((exercise) => !recentIdSet.has(exercise.id))
  }, [filteredExercises, recentRows, isSearchMode])

  function clearQuickAddResetTimer() {
    if (quickAddResetTimerRef.current) {
      clearTimeout(quickAddResetTimerRef.current)
      quickAddResetTimerRef.current = null
    }
  }

  function syncExcludedExerciseIds() {
    setExcludeIds(peekExercisePickerExcludeIds())
  }

  function scheduleQuickAddReset() {
    clearQuickAddResetTimer()
    quickAddResetTimerRef.current = setTimeout(() => {
      setQuickAddState(null)
      syncExcludedExerciseIds()
      quickAddResetTimerRef.current = null
    }, QUICK_ADD_SUCCESS_MS)
  }

  function navigateBack(options?: { leavePage?: boolean }) {
    if (options?.leavePage) {
      navigateExerciseAddBack(
        (navOptions) => navigate(navOptions as Parameters<typeof navigate>[0]),
        returnToRef.current,
      )
      return
    }

    handleExerciseAddPageBack(
      (navOptions) => navigate(navOptions as Parameters<typeof navigate>[0]),
      returnToRef.current,
    )
  }

  async function applyExerciseAdd(
    exercise: Exercise,
    options?: { skipLocalExcludeUpdate?: boolean },
  ) {
    const pickerSession = getExercisePickerSession()
    if (!pickerSession) {
      return
    }

    if (pickerSession.mode === 'replace' && pickerSession.replaceIndex != null) {
      if (pickerSession.context === 'active' || pickerSession.context === 'replace') {
        await replaceExerciseInStore(pickerSession.replaceIndex, exercise)
      } else {
        completeExercisePicker({
          exercise,
          mode: 'replace',
          replaceIndex: pickerSession.replaceIndex,
        })
      }
      navigateBack({ leavePage: true })
      return
    }

    switch (pickerSession.context) {
      case 'active':
      case 'replace':
        await addExerciseToStore(exercise)
        break
      case 'template':
        addPendingExercise(exercise)
        break
      case 'program': {
        if (!pickerSession.programId || !pickerSession.programDayId) {
          throw new Error('Programme introuvable.')
        }

        const day = program?.program_days.find((item) => item.id === pickerSession.programDayId)
        await addProgramExercise.mutateAsync({
          programId: pickerSession.programId,
          programDayId: pickerSession.programDayId,
          exerciseId: exercise.id,
          sortOrder: (day?.program_exercises.length ?? 0) + programAddCount,
          targetSets: 3,
          targetReps: '8-12',
        })
        setProgramAddCount((count) => count + 1)
        break
      }
    }

    excludeExerciseFromPicker(exercise.id)
    if (!options?.skipLocalExcludeUpdate) {
      setExcludeIds((current) =>
        current.includes(exercise.id) ? current : [...current, exercise.id],
      )
    }
  }

  function scheduleQuickAddReturn() {
    clearQuickAddResetTimer()
    quickAddResetTimerRef.current = setTimeout(() => {
      quickAddResetTimerRef.current = null
      navigateBack({ leavePage: true })
    }, QUICK_ADD_SUCCESS_MS)
  }

  async function handleQuickAdd(exercise: Exercise) {
    const pickerSession = getExercisePickerSession()
    if (!pickerSession) {
      return
    }

    const returnAfterQuickAdd = pickerSession.context === 'template'

    setFeedback(null)
    clearQuickAddResetTimer()
    setQuickAddState({ exerciseId: exercise.id, status: 'adding' })

    try {
      await applyExerciseAdd(exercise, {
        skipLocalExcludeUpdate: true,
      })

      if (pickerSession.mode === 'replace') {
        return
      }

      setQuickAddState({ exerciseId: exercise.id, status: 'success' })

      if (returnAfterQuickAdd) {
        scheduleQuickAddReturn()
        return
      }

      scheduleQuickAddReset()
    } catch (error) {
      setQuickAddState(null)
      setFeedback({
        text: error instanceof Error ? error.message : "Impossible d'ajouter cet exercice.",
        variant: 'error',
      })
    }
  }

  async function handleDrawerAdd() {
    const pickerSession = getExercisePickerSession()
    if (!detailExercise || !pickerSession) {
      return
    }

    setFeedback(null)

    try {
      if (pickerSession.mode === 'replace' && pickerSession.replaceIndex != null) {
        await applyExerciseAdd(detailExercise)
        setDetailExercise(null)
        return
      }

      if (pickerSession.context === 'template') {
        await applyExerciseAdd(detailExercise)
        setDetailExercise(null)
        navigateBack({ leavePage: true })
        return
      }

      if (pickerSession.context === 'active' || pickerSession.context === 'replace') {
        await addExerciseToStore(detailExercise)
        excludeExerciseFromPicker(detailExercise.id)
        setDetailExercise(null)
        navigateBack({ leavePage: true })
        return
      }

      if (pickerSession.context === 'program') {
        await applyExerciseAdd(detailExercise)
        setDetailExercise(null)
        navigateBack({ leavePage: true })
      }
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Impossible d'ajouter cet exercice.",
        variant: 'error',
      })
    }
  }

  function handleExerciseCreated(exercise: Exercise) {
    setMuscleGroup('all')
    setQuery(exercise.name)
  }

  function handleBackClick() {
    cancelExerciseAddNavigation(
      (options) => navigate(options as Parameters<typeof navigate>[0]),
      returnToRef.current,
    )
  }

  const pageTitle =
    session?.mode === 'replace' ? "Remplacer l'exercice" : 'Ajouter un exercice'

  const pageDescription =
    session?.mode === 'replace'
      ? 'Choisissez un nouvel exercice. Les séries planifiées seront conservées.'
      : 'Recherchez un exercice, parcourez vos récents ou filtrez par muscle.'

  if (!session && !hadSessionRef.current) {
    return null
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          type="button"
          onClick={handleBackClick}
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-black text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="exercise-search" className="text-sm font-semibold text-foreground">
          Rechercher
        </label>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              id="exercise-search"
              ref={searchInputRef}
              className="rounded-xl pl-9"
              placeholder="Nom, muscle, equipement..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="pill"
            size="icon"
            className="size-9 shrink-0 rounded-xl"
            aria-label="Créer un exercice"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMuscleGroup('all')}
          className={muscleGroup === 'all' ? 'opacity-100' : 'opacity-60'}
        >
          <Pill tone={muscleGroup === 'all' ? 'primary' : 'default'}>Tous</Pill>
        </button>
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setMuscleGroup(group)}
            className={muscleGroup === group ? 'opacity-100' : 'opacity-60'}
          >
            <Pill tone={muscleGroup === group ? 'secondary' : 'default'}>{group}</Pill>
          </button>
        ))}
      </div>

      {feedback ? (
        <FeedbackMessage variant={feedback.variant}>{feedback.text}</FeedbackMessage>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : null}

      {!isLoading && filteredExercises.length === 0 && recentRows.length === 0 ? (
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm text-muted-foreground">Aucun exercice trouvé.</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Créer un exercice
          </Button>
        </div>
      ) : null}

      {!isLoading && !isSearchMode && recentRows.length > 0 ? (
        <ExerciseSearchList
          exercises={recentRows}
          sectionTitle="Récents"
          onSelect={setDetailExercise}
          onQuickAdd={(exercise) => void handleQuickAdd(exercise)}
          quickAddState={quickAddState}
        />
      ) : null}

      {!isLoading && catalogRows.length > 0 ? (
        <ExerciseSearchList
          exercises={catalogRows}
          sectionTitle={isSearchMode ? undefined : 'Catalogue'}
          onSelect={setDetailExercise}
          onQuickAdd={(exercise) => void handleQuickAdd(exercise)}
          quickAddState={quickAddState}
          emptyLabel="Aucun exercice trouvé."
        />
      ) : null}

      <ExerciseDetailDrawer
        open={detailExercise != null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailExercise(null)
          }
        }}
        exercise={detailExercise ? exerciseToDetailTarget(detailExercise) : null}
        onAdd={() => void handleDrawerAdd()}
        addLabel={
          session?.mode === 'replace' ? "Remplacer l'exercice" : "Ajouter l'exercice"
        }
      />

      <CreateExerciseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={query}
        onCreated={handleExerciseCreated}
      />
    </div>
  )
}
