import { Link, useNavigate } from '@tanstack/react-router'
import { BookmarkPlus, CalendarClock, MoreVertical, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
import { WorkoutShareDialog } from '@/components/workout/WorkoutShareDialog'
import { TemplateLimitDialog } from '@/components/subscription/TemplateLimitDialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WorkoutDetail, WorkoutSummary } from '@/lib/graphql/operations'
import { buildPlanningSearchParams } from '@/lib/schedule/planning-navigation'
import {
  useCreateTemplateFromWorkout,
  useTemplateBySourceWorkout,
} from '@/hooks/useWorkoutSharing'
import { useDeleteWorkout } from '@/hooks/useWorkouts'
import { useEntitlement } from '@/hooks/useSubscription'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { waitForDialogClose } from '@/lib/router/dialog-navigation'
import { cn } from '@/lib/utils'

function openDeleteDialogAfterMenuClose(
  setMenuOpen: (open: boolean) => void,
  setDeleteDialogOpen: (open: boolean) => void,
) {
  setMenuOpen(false)
  window.requestAnimationFrame(() => {
    setDeleteDialogOpen(true)
  })
}

type WorkoutMenuData = (WorkoutDetail | WorkoutSummary) & {
  share_token?: string | null
  workout_template_id?: string | null
}

type WorkoutDetailMenuProps = {
  workout: WorkoutMenuData
  compact?: boolean
  variant?: 'owner' | 'shared'
}

export function WorkoutDetailMenu({
  workout,
  compact = false,
  variant = 'owner',
}: WorkoutDetailMenuProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isSharedView = variant === 'shared'
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: savedTemplate } = useTemplateBySourceWorkout(
    workout.id,
    menuOpen && !workout.workout_template_id && isAuthenticated,
  )
  const linkedTemplateId = workout.workout_template_id ?? savedTemplate?.id ?? null
  const createTemplate = useCreateTemplateFromWorkout()
  const deleteWorkout = useDeleteWorkout()
  const { entitled: hasUnlimitedTemplates } = useEntitlement('unlimited_templates')
  const { data: templates } = useWorkoutTemplates()
  const templateCount = templates?.length ?? 0
  const atTemplateLimit =
    !hasUnlimitedTemplates && templateCount >= FREE_WORKOUT_TEMPLATES

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveAsTemplate(name: string) {
    setError(null)
    try {
      const template = await createTemplate.mutateAsync({ workout, name })
      setSaveDialogOpen(false)
      await waitForDialogClose()
      await navigate({
        to: '/app/sessions/$templateId',
        params: { templateId: template.id },
        viewTransition: false,
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer le modèle."
      setError(message)
      throw saveError
    }
  }

  async function handleDelete() {
    setError(null)

    try {
      await deleteWorkout.mutateAsync(workout.id)
      setDeleteDialogOpen(false)
      setMenuOpen(false)

      await waitForDialogClose()
      void navigate({
        to: '/app/sessions',
        search: { tab: 'history' },
        viewTransition: false,
      })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer la séance.',
      )
    }
  }

  const isBusy = createTemplate.isPending || deleteWorkout.isPending

  function handleSaveAsTemplateClick() {
    if (isSharedView && !isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      void navigate({ to: '/auth/login', search: { returnTo } })
      return
    }

    if (atTemplateLimit) {
      setLimitDialogOpen(true)
      return
    }

    setSaveDialogOpen(true)
  }

  return (
    <div
      className="flex flex-col items-end gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={compact ? 'ghost' : 'outline'}
            size="icon"
            className={compact ? 'size-8 rounded-full' : 'rounded-full'}
            aria-label="Actions de la séance"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!isSharedView ? (
            <>
              <DropdownMenuItem
                disabled={isBusy}
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="size-4" />
                Partager la séance
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/app/planning"
                  search={buildPlanningSearchParams({
                    title: workout.title,
                    templateId: linkedTemplateId ?? undefined,
                    openScheduleForm: true,
                  })}
                >
                  <CalendarClock className="size-4" />
                  Programmer une recurrence
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          {linkedTemplateId ? (
            <>
              {!isSharedView ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem asChild>
                <Link
                  to="/app/sessions/$templateId"
                  params={{ templateId: linkedTemplateId }}
                >
                  <BookmarkPlus className="size-4" />
                  Consulter le modèle
                </Link>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              disabled={isBusy}
              onClick={handleSaveAsTemplateClick}
            >
              <BookmarkPlus className="size-4" />
              {isSharedView ? 'Ajouter le modèle' : 'Enregistrer comme modèle'}
            </DropdownMenuItem>
          )}
          {!isSharedView ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isBusy}
                className="text-destructive focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  openDeleteDialogAfterMenuClose(setMenuOpen, setDeleteDialogOpen)
                }}
              >
                <Trash2 className="size-4" />
                Supprimer la séance
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        <p
          className={
            compact
              ? 'max-w-32 truncate text-right text-xs text-destructive'
              : 'max-w-56 text-right text-xs text-destructive'
          }
        >
          {error}
        </p>
      ) : null}

      {!isSharedView ? (
        <WorkoutShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          workout={workout}
        />
      ) : null}

      <TemplateLimitDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen} />

      <SessionNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleSaveAsTemplate}
        isPending={createTemplate.isPending}
        title={isSharedView ? 'Ajouter le modèle' : 'Enregistrer comme modèle'}
        description={
          isSharedView
            ? 'Importez cette séance comme modèle réutilisable dans votre catalogue.'
            : 'Créez un modèle reutilisable a partir de cette séance.'
        }
        placeholder={workout.title}
        confirmLabel={isSharedView ? 'Ajouter' : 'Enregistrer'}
        defaultName={workout.title}
        quotaRecap={
          !hasUnlimitedTemplates
            ? { current: templateCount, max: FREE_WORKOUT_TEMPLATES }
            : undefined
        }
      />

      {!isSharedView ? (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {workout.title} » sera retiré de votre historique. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteWorkout.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={deleteWorkout.isPending}
              className={cn(
                buttonVariants(),
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}
              onClick={() => void handleDelete()}
            >
              {deleteWorkout.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      ) : null}
    </div>
  )
}
