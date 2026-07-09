import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { subWeeks } from 'date-fns'
import { CalendarDays, Play, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SwipeableTabPanels } from '@/components/sessions/SwipeableTabPanels'
import { StatsDashboard } from '@/components/stats/StatsDashboard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard'
import { TemplateLimitDialog } from '@/components/subscription/TemplateLimitDialog'
import { TemplateFrozenDialog } from '@/components/subscription/TemplateFrozenDialog'
import { UpgradePrompt } from '@/components/subscription/PremiumGate'
import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
import { TemplateCatalogList } from '@/components/workout/TemplateCatalogList'
import { WorkoutSessionConflictDialog } from '@/components/workout/WorkoutSessionConflictDialog'
import { Pill } from '@/design-system'
import {
  DEFAULT_GLOBAL_REST_SECONDS,
  isGraphqlTemplatesMissingError,
  templateToDraft,
  useCreateEmptyWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useWorkoutTemplates,
} from '@/hooks/useWorkoutTemplates'
import { useMyProfile } from '@/hooks/useProfile'
import { useEntitlement } from '@/hooks/useSubscription'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import {
  HISTORY_WORKOUTS_INITIAL_PAGE_SIZE,
  HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE,
  useMyWorkoutsInfinite,
} from '@/hooks/useWorkouts'
import { buildNextOccurrenceByTemplateId } from '@/lib/schedule/expand-occurrences'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { templateExercisesToActive } from '@/lib/workout/template-mapper'
import { FREE_HISTORY_WEEKS, FREE_WORKOUT_TEMPLATES } from '@/lib/subscription/entitlements'
import {
  countActiveTemplates,
  countTemplateUsageFromWorkouts,
  rankTemplatesByUsage,
  resolveFrozenTemplateIds,
} from '@/lib/subscription/template-access'
import { useMyWorkouts } from '@/hooks/useWorkouts'

type SessionsSearch = {
  tab?: 'catalog' | 'history' | 'stats'
}

function parseSessionsTab(tab: unknown): SessionsSearch['tab'] {
  if (tab === 'history' || tab === 'stats') {
    return tab
  }

  return 'catalog'
}

export const Route = createFileRoute('/app/sessions/')({
  validateSearch: (search: Record<string, unknown>): SessionsSearch => ({
    tab: parseSessionsTab(search.tab),
  }),
  component: SessionsPage,
})

function SessionsPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const activeTab = tab ?? 'catalog'

  const tabs = useMemo(
    () => [
      { id: 'catalog' as const, label: 'Catalogue', panel: <CatalogTab /> },
      { id: 'history' as const, label: 'Historique', panel: <HistoryTab /> },
      { id: 'stats' as const, label: 'Stats', panel: <StatsDashboard /> },
    ],
    [],
  )

  const handleTabChange = useCallback(
    (nextTab: 'catalog' | 'history' | 'stats') => {
      void navigate({
        search: { tab: nextTab },
        replace: true,
        viewTransition: false,
      })
    },
    [navigate],
  )

  return (
    <SwipeableTabPanels
      value={activeTab}
      onChange={handleTabChange}
      tabs={tabs}
    />
  )
}

function CatalogTab() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)
  const [frozenDialogOpen, setFrozenDialogOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<
    NonNullable<ReturnType<typeof useWorkoutTemplates>['data']>[number] | null
  >(null)
  const [isStartingTemplate, setIsStartingTemplate] = useState(false)
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)
  const currentSessionTitle = useActiveWorkoutStore((state) => state.title)
  const cancelWorkout = useActiveWorkoutStore((state) => state.cancelWorkout)
  const startWorkoutFromTemplate = useActiveWorkoutStore(
    (state) => state.startWorkoutFromTemplate,
  )
  const { data: templates, isLoading, error } = useWorkoutTemplates()
  const { data: workouts = [] } = useMyWorkouts()
  const { entitled: hasUnlimitedTemplates, isPremium } = useEntitlement('unlimited_templates')
  const { data: scheduledResult } = useScheduledSessions()
  const deleteTemplate = useDeleteWorkoutTemplate()
  const createEmpty = useCreateEmptyWorkoutTemplate()

  const frozenTemplateIds = useMemo(() => {
    if (!templates) {
      return new Set<string>()
    }

    const usage = countTemplateUsageFromWorkouts(workouts)
    const ranked = rankTemplatesByUsage(templates, usage)
    return resolveFrozenTemplateIds(ranked, isPremium)
  }, [isPremium, templates, workouts])

  const activeTemplateCount = templates
    ? countActiveTemplates(templates, frozenTemplateIds)
    : 0
  const atTemplateLimit =
    !hasUnlimitedTemplates && activeTemplateCount >= FREE_WORKOUT_TEMPLATES

  const nextOccurrenceByTemplateId = useMemo(
    () => buildNextOccurrenceByTemplateId(scheduledResult?.sessions ?? []),
    [scheduledResult?.sessions],
  )

  const templatesMissing = isGraphqlTemplatesMissingError(error)

  async function handleCreate(name: string) {
    if (atTemplateLimit) {
      return
    }

    const template = await createEmpty.mutateAsync(name)
    await navigate({
      to: '/app/sessions/$templateId',
      params: { templateId: template.id },
    })
  }

  async function handleStart(template: NonNullable<typeof templates>[number]) {
    const draft = templateToDraft(template)
    await startWorkoutFromTemplate(
      template.name,
      templateExercisesToActive(draft.exercises),
      DEFAULT_GLOBAL_REST_SECONDS,
      template.id,
    )
    await navigate({ to: '/app/workout/active' })
  }

  function requestStart(template: NonNullable<typeof templates>[number]) {
    if (frozenTemplateIds.has(template.id)) {
      setFrozenDialogOpen(true)
      return
    }

    if (startedAt) {
      setPendingTemplate(template)
      setConflictOpen(true)
      return
    }

    void handleStart(template)
  }

  async function handleAbandonAndStart() {
    if (!pendingTemplate) {
      return
    }

    const template = pendingTemplate
    setIsStartingTemplate(true)

    try {
      setConflictOpen(false)
      setPendingTemplate(null)
      await cancelWorkout()
      await handleStart(template)
    } finally {
      setIsStartingTemplate(false)
    }
  }

  function handleResumeCurrentSession() {
    setConflictOpen(false)
    setPendingTemplate(null)
    void navigate({ to: '/app/workout/active' })
  }

  function handleConflictOpenChange(open: boolean) {
    setConflictOpen(open)
    if (!open) {
      setPendingTemplate(null)
    }
  }

  function requestNewTemplate() {
    if (atTemplateLimit) {
      setLimitDialogOpen(true)
      return
    }

    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <WorkoutSessionConflictDialog
        open={conflictOpen}
        onOpenChange={handleConflictOpenChange}
        currentSessionTitle={currentSessionTitle}
        nextSessionLabel={pendingTemplate?.name ?? 'cette séance'}
        onResume={handleResumeCurrentSession}
        onAbandonAndStart={() => void handleAbandonAndStart()}
        isPending={isStartingTemplate}
      />
      <TemplateLimitDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen} />
      <TemplateFrozenDialog open={frozenDialogOpen} onOpenChange={setFrozenDialogOpen} />
      <SessionNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleCreate}
        isPending={createEmpty.isPending}
        quotaRecap={
          !hasUnlimitedTemplates
            ? { current: activeTemplateCount, max: FREE_WORKOUT_TEMPLATES }
            : undefined
        }
      />
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Planning</CardTitle>
              <CardDescription>
                Planifiez vos séances et suivez votre calendrier d'entraînement.
              </CardDescription>
            </div>
            <Button variant="soft" size="sm" className="rounded-full" asChild>
              <Link to="/app/planning">
                <CalendarDays className="size-4" />
                Ouvrir
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card className="gap-0 overflow-hidden rounded-2xl border-border">
        <CardHeader className="px-4 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Mes modèles</CardTitle>
              <CardDescription>
                Séances pré-construites, prêtes à démarrer.
                {!hasUnlimitedTemplates ? (
                  <>
                    {' '}
                    ({activeTemplateCount}/{FREE_WORKOUT_TEMPLATES}
                    {frozenTemplateIds.size > 0
                      ? `, ${frozenTemplateIds.size} gelé${frozenTemplateIds.size > 1 ? 's' : ''}`
                      : ''}
                    )
                  </>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="soft"
                size="sm"
                className="rounded-full"
                onClick={requestNewTemplate}
              >
                <Plus className="size-4" />
                Nouveau
              </Button>
              <Button
                variant="pill"
                size="icon"
                className="rounded-full"
                aria-label="Démarrer une séance"
                asChild
              >
                <Link to="/app/workout/active">
                  <Play className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <div className="mx-4 mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Erreur de chargement'}
              </p>
              {templatesMissing ? (
                <p className="mt-2 text-muted-foreground">
                  Backend non à jour — redéployez Nhost (migrations workout_templates)
                  puis relancez l&apos;application.
                </p>
              ) : null}
            </div>
          ) : null}
          {!isLoading && !error && templates?.length === 0 ? (
            <div className="mx-4 mb-4 rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun modèle pour le moment.
              </p>
              <Button variant="pill" className="mt-4" onClick={requestNewTemplate}>
                Créer une séance
              </Button>
            </div>
          ) : null}
          {templates && templates.length > 0 ? (
            <TemplateCatalogList
              templates={templates}
              scheduledSessions={scheduledResult?.sessions ?? []}
              nextOccurrenceByTemplateId={nextOccurrenceByTemplateId}
              frozenTemplateIds={frozenTemplateIds}
              onStart={requestStart}
              onFrozenTap={() => setFrozenDialogOpen(true)}
              onDelete={(templateId) => void deleteTemplate.mutateAsync(templateId)}
              isDeleting={deleteTemplate.isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function HistoryTab() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyWorkoutsInfinite({
    initialPageSize: HISTORY_WORKOUTS_INITIAL_PAGE_SIZE,
    pageSize: HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE,
  })
  const { data: profile } = useMyProfile()
  const { entitled: hasUnlimitedHistory } = useEntitlement('unlimited_history')
  const { targetRef, isIntersecting } = useIntersectionObserver({
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  })

  const workouts = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.workouts) ?? []
    if (hasUnlimitedHistory) {
      return all
    }

    const cutoff = subWeeks(new Date(), FREE_HISTORY_WEEKS).toISOString()
    return all.filter((workout) => workout.started_at >= cutoff)
  }, [data, hasUnlimitedHistory])
  const loadedCount = workouts.length
  const hasHiddenHistory =
    !hasUnlimitedHistory &&
    (data?.pages.flatMap((page) => page.workouts) ?? []).length > workouts.length

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isIntersecting])

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border">
      <CardHeader className="px-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display font-black">Historique</CardTitle>
            <CardDescription>Séances terminées et synchronisées.</CardDescription>
          </div>
          <Pill tone="purple">
            <CalendarDays className="size-3" />
            {hasNextPage ? `${loadedCount}+` : loadedCount}
          </Pill>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {hasHiddenHistory ? (
          <div className="px-4 pb-4">
            <UpgradePrompt
              title="Historique illimité"
              description={`Le plan Gratuit affiche les ${FREE_HISTORY_WEEKS} dernières semaines. Passez en Premium pour retrouver tout votre historique.`}
            />
          </div>
        ) : null}
        {isLoading ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Chargement...</p>
        ) : null}
        {error ? (
          <p className="px-4 pb-4 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Erreur de chargement'}
          </p>
        ) : null}
        {!isLoading && !error && workouts.length === 0 ? (
          <div className="mx-4 mb-4 rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune séance enregistrée pour le moment.
            </p>
            <Button variant="pill" className="mt-4" asChild>
              <Link to="/app/workout/active">Démarrer une séance</Link>
            </Button>
          </div>
        ) : null}
        <ul className="divide-y divide-border border-t border-border">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <WorkoutHistoryCard
                workout={workout}
                profile={profile}
                allWorkouts={workouts}
                variant="embedded"
              />
            </li>
          ))}
        </ul>
        {hasNextPage ? (
          <div ref={targetRef} className="border-t border-border px-4 py-4 text-center">
            {isFetchingNextPage ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {loadedCount} séance{loadedCount > 1 ? 's' : ''} affichée
                {loadedCount > 1 ? 's' : ''}
                {hasNextPage ? ' — faites défiler pour en voir plus' : ''}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
