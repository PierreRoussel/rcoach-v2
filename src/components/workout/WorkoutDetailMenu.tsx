import { Link, useNavigate } from '@tanstack/react-router'
import { BookmarkPlus, CalendarClock, Link2, MoreVertical } from 'lucide-react'
import { useState } from 'react'

import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
import { Button } from '@/components/ui/button'
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

type WorkoutMenuData = (WorkoutDetail | WorkoutSummary) & {
  share_token?: string | null
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
  const { data: existingTemplate } = useTemplateBySourceWorkout(
    workout.id,
    menuOpen,
  )
  const enableShare = useEnableWorkoutShare()
  const createTemplate = useCreateTemplateFromWorkout()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
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
          'Le partage necessite un redeploiement Nhost (migration workout_sharing).',
        )
        return
      }

      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Impossible de partager la seance.',
      )
    }
  }

  async function handleSaveAsTemplate(name: string) {
    const template = await createTemplate.mutateAsync({ workout, name })
    await navigate({
      to: '/app/sessions/$templateId',
      params: { templateId: template.id },
    })
  }

  const isBusy = enableShare.isPending || createTemplate.isPending

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
            aria-label="Actions de la seance"
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
            Partager la seance
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/app/planning"
              search={buildPlanningSearchParams({
                title: workout.title,
                templateId: existingTemplate?.id,
                openScheduleForm: true,
              })}
            >
              <CalendarClock className="size-4" />
              Programmer une recurrence
            </Link>
          </DropdownMenuItem>
          {existingTemplate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/app/sessions/$templateId"
                  params={{ templateId: existingTemplate.id }}
                >
                  <BookmarkPlus className="size-4" />
                  Voir le modele
                </Link>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => setSaveDialogOpen(true)}
            >
              <BookmarkPlus className="size-4" />
              Enregistrer comme modele
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!compact && currentShareToken ? (
        <p className="max-w-48 truncate text-right font-data text-[10px] text-muted-foreground">
          Lien actif
        </p>
      ) : null}
      {!compact && message ? (
        <p className="max-w-56 text-right text-xs text-secondary-foreground">
          {message}
        </p>
      ) : null}
      {!compact && error ? (
        <p className="max-w-56 text-right text-xs text-destructive">{error}</p>
      ) : null}

      <SessionNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleSaveAsTemplate}
        isPending={createTemplate.isPending}
        title="Enregistrer comme modele"
        description="Creez un modele reutilisable a partir de cette seance."
        placeholder={workout.title}
        confirmLabel="Enregistrer"
        defaultName={workout.title}
      />
    </div>
  )
}
