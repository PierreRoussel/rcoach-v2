import { Dumbbell, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  getExerciseDemoFileUrl,
  getMuscleFallbackPosterPath,
} from '@/lib/storage/exercise-demo'
import type { ExerciseContentStatus } from '@/lib/workout/exercise-coaching'
import { cn } from '@/lib/utils'

type ExerciseDemoPlayerProps = {
  demoFileId: string | null | undefined
  posterFileId: string | null | undefined
  muscleGroup: string | null | undefined
  contentStatus: ExerciseContentStatus | null | undefined
  exerciseName: string
  className?: string
}

const FRAME_CLASS =
  'relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-[0_16px_32px_-10px_rgba(44,37,69,0.28),0_6px_16px_-8px_rgba(44,37,69,0.16)] ring-1 ring-black/8'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

export function ExerciseDemoPlayer({
  demoFileId,
  posterFileId,
  muscleGroup,
  contentStatus,
  exerciseName,
  className,
}: ExerciseDemoPlayerProps) {
  const { nhost } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [videoFailed, setVideoFailed] = useState(false)

  const demoUrl = useMemo(
    () => getExerciseDemoFileUrl(nhost, demoFileId),
    [demoFileId, nhost],
  )
  const posterUrl = useMemo(
    () => getExerciseDemoFileUrl(nhost, posterFileId),
    [nhost, posterFileId],
  )
  const fallbackPoster = getMuscleFallbackPosterPath(muscleGroup)

  const showVideo =
    Boolean(demoUrl) &&
    contentStatus === 'ready' &&
    !prefersReducedMotion &&
    !videoFailed

  useEffect(() => {
    setVideoFailed(false)
  }, [demoUrl])

  useEffect(() => {
    if (!showVideo || !videoRef.current) {
      return
    }

    void videoRef.current.play().catch(() => {
      setVideoFailed(true)
    })
  }, [showVideo, demoUrl])

  if (contentStatus === 'pending') {
    return (
      <div className={cn(FRAME_CLASS, className)}>
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-4 py-3">
          <p className="text-sm font-medium text-white">Préparation de la démo…</p>
        </div>
      </div>
    )
  }

  if (showVideo && demoUrl) {
    return (
      <div className={cn(FRAME_CLASS, className)}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={demoUrl}
          poster={posterUrl ?? fallbackPoster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={`Démonstration de ${exerciseName}`}
          onError={() => setVideoFailed(true)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
    )
  }

  const staticPoster = posterUrl ?? fallbackPoster

  return (
    <div className={cn(FRAME_CLASS, className)}>
      <img
        src={staticPoster}
        alt={`Illustration ${exerciseName}`}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-background/85 shadow-sm">
          {contentStatus === 'partial' || !demoUrl ? (
            <Dumbbell className="size-5 text-muted-foreground" aria-hidden />
          ) : (
            <Play className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <p className="text-sm font-medium text-white drop-shadow">
          {contentStatus === 'partial' || !demoUrl
            ? 'Démo vidéo non disponible'
            : 'Aperçu statique'}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  )
}
