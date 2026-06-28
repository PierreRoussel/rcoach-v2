import { Link, useNavigate } from '@tanstack/react-router'
import { BookmarkPlus, CalendarClock, Link2, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
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
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { buildPlanningSearchParams } from '@/lib/schedule/planning-navigation'
import {
  copyWorkoutShareLink,
  ensureWorkoutShareToken,
  useCreateTemplateFromWorkout,
  useEnableWorkoutShare,
  useTemplateBySourceWorkout,
} from '@/hooks/useWorkoutSharing'
import { useDeleteWorkout } from '@/hooks/useWorkouts'
import { cn } from '@/lib/utils'

const DIALOG_CLOSE_MS = 200

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
}

export function WorkoutDetailMenu({
  workout,
  compact = false,
}: WorkoutDetailMenuProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: savedTemplate } = useTemplateBySourceWorkout(
    workout.id,
    menuOpen && !workout.workout_template_id,
  )
  const linkedTemplateId = workout.workout_template_id ?? savedTemplate?.id ?? null
  const enableShare = useEnableWorkoutShare()
  const createTemplate = useCreateTemplateFromWorkout()
  const deleteWorkout = useDeleteWorkout()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentShareToken, setCurrentShareToken] = useState(
    workout.share_token,
  )

  async function handleShare() {
    setError(null)
    setMessage(null)

    try {
      const shareToken = await ensureWorkoutShareToken(
        { ...workout, share_token: currentShareToken ?? workout.share_token },
        async (input) => {
          const result = await enableShare.mutateAsync(input)
          setCurrentShareToken(result.share_token)
          return result
        },
      )

      const url = await copyWorkoutShareLink(shareToken)
      setMessage(`Lien copie : ${url}`)
    } catch (shareError) {
      if (isGraphqlMissingFieldError(shareError, 'share_token')) {
        setError(
          'Le partage nécessite un redéploiement Nhost (migration workout_sharing).',
        )
        return
      }

      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Impossible de partager la séance.',
      )
    }
  }

  async function handleSaveAsTemplate(name: string) {
    setError(null)
    try {
      const template = await createTemplate.mutateAsync({ workout, name })
      await navigate({
        to: '/app/sessions/$templateId',
        params: { templateId: template.id },
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

      window.setTimeout(() => {
        void navigate({ to: '/app/sessions', search: { tab: 'history' } })
      }, DIALOG_CLOSE_MS)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer la séance.',
      )
    }
  }

  const isBusy =
    enableShare.isPending || createTemplate.isPending || deleteWorkout.isPending

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
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => void handleShare()}
          >
            <Link2 className="size-4" />
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
          {linkedTemplateId ? (
            <>
              <DropdownMenuSeparator />
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
              onClick={() => setSaveDialogOpen(true)}
            >
              <BookmarkPlus className="size-4" />
              Enregistrer comme modèle
            </DropdownMenuItem>
          )}
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
        </DropdownMenuContent>
      </DropdownMenu>

      {!compact && currentShareToken ? (
        <p className="max-w-48 truncate text-right font-data text-[10px] text-muted-foreground">
          Lien actif
        </p>
      ) : null}
      {!compact && message ? (
        <p className="max-w-56 text-right text-xs text-success">
          {message}
        </p>
      ) : null}
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

      <SessionNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleSaveAsTemplate}
        isPending={createTemplate.isPending}
        title="Enregistrer comme modèle"
        description="Créez un modèle reutilisable a partir de cette séance."
        placeholder={workout.title}
        confirmLabel="Enregistrer"
        defaultName={workout.title}
      />

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
    </div>
  )
}
