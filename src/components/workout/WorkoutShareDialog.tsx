import { Download, Link2, Loader2, Share2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { WorkoutShareCard } from '@/components/workout/WorkoutShareCard'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { useStatsWorkouts } from '@/hooks/useStatsWorkouts'
import {
  copyWorkoutShareLink,
  ensureWorkoutShareToken,
  useEnableWorkoutShare,
} from '@/hooks/useWorkoutSharing'
import { useWorkoutWeeklyStreak } from '@/hooks/useWorkouts'
import type { WorkoutDetail, WorkoutSummary } from '@/lib/graphql/operations'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import {
  downloadShareImage,
  exportShareCardElement,
  shareWorkoutImage,
} from '@/lib/workout/share-image'
import { useMyProfile } from '@/hooks/useProfile'

type WorkoutShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workout: (WorkoutDetail | WorkoutSummary) & { share_token?: string | null }
}

export function WorkoutShareDialog({
  open,
  onOpenChange,
  workout,
}: WorkoutShareDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const enableShare = useEnableWorkoutShare()
  const { data: profile } = useMyProfile()
  const { workouts: allWorkouts } = useStatsWorkouts('all')
  const { streak: weeklyStreak } = useWorkoutWeeklyStreak()
  const [shareToken, setShareToken] = useState(workout.share_token ?? null)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolveShareToken() {
    return ensureWorkoutShareToken(
      { ...workout, share_token: shareToken ?? workout.share_token },
      async (input) => {
        const result = await enableShare.mutateAsync(input)
        setShareToken(result.share_token)
        return result
      },
    )
  }

  async function exportCard() {
    if (!cardRef.current) {
      throw new Error("L'aperçu n'est pas prêt.")
    }

    return exportShareCardElement(cardRef.current)
  }

  async function handleShareImage() {
    setError(null)
    setMessage(null)
    setIsBusy(true)

    try {
      await resolveShareToken()
      const blob = await exportCard()
      await shareWorkoutImage(blob, {
        title: workout.title,
        text: `Ma séance « ${workout.title} » sur RCoach`,
      })
      setMessage('Image partagée.')
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
          : "Impossible de partager l'image.",
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDownloadImage() {
    setError(null)
    setMessage(null)
    setIsBusy(true)

    try {
      const blob = await exportCard()
      await downloadShareImage(blob)
      setMessage('Image enregistrée.')
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Impossible d'enregistrer l'image.",
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handleCopyLink() {
    setError(null)
    setMessage(null)
    setIsBusy(true)

    try {
      const token = await resolveShareToken()
      const url = await copyWorkoutShareLink(token)
      setMessage(`Lien copié : ${url}`)
    } catch (linkError) {
      if (isGraphqlMissingFieldError(linkError, 'share_token')) {
        setError(
          'Le partage nécessite un redéploiement Nhost (migration workout_sharing).',
        )
        return
      }

      setError(
        linkError instanceof Error ? linkError.message : 'Impossible de copier le lien.',
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-black">Partager la séance</DrawerTitle>
          <DrawerDescription>
            Publiez une carte visuelle sur Instagram ou Facebook, ou copiez le lien.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col items-center gap-4 overflow-y-auto px-4 pb-6">
          <div className="rounded-2xl bg-muted/40 p-3">
            <WorkoutShareCard
              ref={cardRef}
              workout={workout}
              authorName={profile?.display_name}
              weeklyStreak={weeklyStreak}
              allWorkouts={allWorkouts}
            />
          </div>

          <div className="grid w-full max-w-sm grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="pill"
              disabled={isBusy}
              onClick={() => void handleShareImage()}
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              Partager l&apos;image
            </Button>
            <Button
              type="button"
              variant="soft"
              disabled={isBusy}
              onClick={() => void handleDownloadImage()}
            >
              <Download className="size-4" />
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => void handleCopyLink()}
            >
              <Link2 className="size-4" />
              Copier le lien
            </Button>
          </div>

          {message ? <FeedbackMessage variant="success">{message}</FeedbackMessage> : null}
          {error ? <FeedbackMessage variant="error">{error}</FeedbackMessage> : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
