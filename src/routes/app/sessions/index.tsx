import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, Dumbbell, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard'
import { PageHeader, Pill } from '@/design-system'
import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
import {
  DEFAULT_GLOBAL_REST_SECONDS,
  isGraphqlTemplatesMissingError,
  templateToDraft,
  useCreateEmptyWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useWorkoutTemplates,
} from '@/hooks/useWorkoutTemplates'
import { useMyProfile } from '@/hooks/useProfile'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useMyWorkoutsInfinite } from '@/hooks/useWorkouts'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { templateExercisesToActive } from '@/lib/workout/template-mapper'

type SessionsSearch = {
  tab?: 'catalog' | 'history'
}

export const Route = createFileRoute('/app/sessions/')({
  validateSearch: (search: Record<string, unknown>): SessionsSearch => ({
    tab: search.tab === 'history' ? 'history' : 'catalog',
  }),
  component: SessionsPage,
})

function SessionsPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const activeTab = tab ?? 'catalog'

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Seances"
        title="Catalogue & historique"
        description="Creez des modeles de seances et consultez vos seances terminees."
      />

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'catalog' ? 'pill' : 'soft'}
          size="sm"
          onClick={() => void navigate({ search: { tab: 'catalog' } })}
        >
          Catalogue
        </Button>
        <Button
          variant={activeTab === 'history' ? 'pill' : 'soft'}
          size="sm"
          onClick={() => void navigate({ search: { tab: 'history' } })}
        >
          Historique
        </Button>
      </div>

      {activeTab === 'catalog' ? <CatalogTab /> : <HistoryTab />}
    </div>
  )
}

function CatalogTab() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const startWorkoutFromTemplate = useActiveWorkoutStore(
    (state) => state.startWorkoutFromTemplate,
  )
  const { data: templates, isLoading, error } = useWorkoutTemplates()
  const deleteTemplate = useDeleteWorkoutTemplate()
  const createEmpty = useCreateEmptyWorkoutTemplate()

  const templatesMissing = isGraphqlTemplatesMissingError(error)

  async function handleCreate(name: string) {
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
    )
    await navigate({ to: '/app/workout/active' })
  }

  return (
    <>
      <SessionNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleCreate}
        isPending={createEmpty.isPending}
      />
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Planning</CardTitle>
              <CardDescription>
                Planifiez vos seances et suivez votre calendrier d entrainement.
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
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Mes modeles</CardTitle>
              <CardDescription>
                Seances pre-construites, pretes a demarrer.
              </CardDescription>
            </div>
            <Button variant="pill" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Nouveau
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Erreur de chargement'}
              </p>
              {templatesMissing ? (
                <p className="mt-2 text-muted-foreground">
                  Backend non a jour — redeployez Nhost (migrations workout_templates)
                  puis relancez l&apos;application.
                </p>
              ) : null}
            </div>
          ) : null}
          {!isLoading && !error && templates?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun modele pour le moment.
              </p>
              <Button variant="pill" className="mt-4" onClick={() => setDialogOpen(true)}>
                Creer une seance
              </Button>
            </div>
          ) : null}
        {templates?.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-black">{template.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Dumbbell className="size-3" />
                  {template.workout_template_exercises.length} exercices
                </p>
              </div>
              <Pill tone="secondary">
                {format(new Date(template.updated_at), 'd MMM', { locale: fr })}
              </Pill>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="pill"
                size="sm"
                onClick={() => void handleStart(template)}
              >
                <Play className="size-4" />
                Demarrer
              </Button>
              <Button variant="soft" size="sm" asChild>
                <Link
                  to="/app/sessions/$templateId"
                  params={{ templateId: template.id }}
                >
                  <Pencil className="size-4" />
                  Modifier
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void deleteTemplate.mutateAsync(template.id)}
                disabled={deleteTemplate.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    </>
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
  } = useMyWorkoutsInfinite()
  const { data: profile } = useMyProfile()
  const { targetRef, isIntersecting } = useIntersectionObserver({
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  })

  const workouts = useMemo(
    () => data?.pages.flatMap((page) => page.workouts) ?? [],
    [data],
  )
  const loadedCount = workouts.length

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
            <CardDescription>Seances terminees et synchronisees.</CardDescription>
          </div>
          <Pill tone="purple">
            <CalendarDays className="size-3" />
            {hasNextPage ? `${loadedCount}+` : loadedCount}
          </Pill>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
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
              Aucune seance enregistree pour le moment.
            </p>
            <Button variant="pill" className="mt-4" asChild>
              <Link to="/app/workout/active">Demarrer une seance</Link>
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
                {loadedCount} seance{loadedCount > 1 ? 's' : ''} affichee
                {loadedCount > 1 ? 's' : ''}
                {hasNextPage ? ' — faites defiler pour en voir plus' : ''}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
