import { useMemo, useState } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { endOfDay, startOfDay, subDays } from 'date-fns'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useMyWorkoutsInRange } from '@/hooks/useWorkouts'
import { getYesterdayMissedOccurrences } from '@/lib/schedule/missed-occurrences'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { cn } from '@/lib/utils'

function formatMissedSessionMessage(occurrences: ScheduleOccurrence[]): string {
  const primary = occurrences[0]
  if (!primary) {
    return ''
  }

  const label = primary.title || primary.workoutTemplateName || 'Séance planifiée'
  const suffix =
    occurrences.length > 1
      ? ` (+${occurrences.length - 1} autre${occurrences.length > 2 ? 's' : ''})`
      : ''

  return `${label} était prévue hier${suffix}`
}

export function MissedPlannedSessionHomeTile() {
  const activeWorkoutStartedAt = useActiveWorkoutStore((state) => state.startedAt)
  const { data: sessionsResult, isLoading: sessionsLoading } = useScheduledSessions()
  const yesterdayRange = useMemo(() => {
    const day = subDays(startOfDay(new Date()), 1)
    return { start: day, end: endOfDay(day) }
  }, [])
  const { data: yesterdayWorkouts = [], isLoading: workoutsLoading } =
    useMyWorkoutsInRange(yesterdayRange)
  const { startPlannedSession, isStarting } = useStartPlannedSession()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const scheduleAvailable = sessionsResult?.deployed ?? true
  const missedOccurrences = useMemo(
    () =>
      getYesterdayMissedOccurrences(
        sessionsResult?.sessions ?? [],
        yesterdayWorkouts,
      ),
    [sessionsResult?.sessions, yesterdayWorkouts],
  )

  const primaryOccurrence = missedOccurrences[0] ?? null
  const isLoading = sessionsLoading || workoutsLoading

  if (
    !scheduleAvailable ||
    isLoading ||
    activeWorkoutStartedAt ||
    missedOccurrences.length === 0 ||
    !primaryOccurrence
  ) {
    return null
  }

  const sessionLabel =
    primaryOccurrence.title ||
    primaryOccurrence.workoutTemplateName ||
    'Séance planifiée'

  async function handleConfirmStart() {
    await startPlannedSession(primaryOccurrence!)
    setConfirmOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'block w-full rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-card to-card px-3.5 py-3 text-left shadow-sm',
          'transition-colors active:bg-muted/40',
        )}
        aria-label={`Compléter la séance manquée : ${sessionLabel}`}
        onClick={() => setConfirmOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <CalendarClock className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-sm font-bold text-foreground">
                Séance manquée
              </p>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatMissedSessionMessage(missedOccurrences)}
            </p>
            <p className="mt-2 text-xs font-medium text-primary">
              Compléter aujourd&apos;hui
            </p>
          </div>
        </div>
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compléter la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous aviez prévu{' '}
              <span className="font-semibold text-foreground">{sessionLabel}</span> hier.
              Voulez-vous la faire maintenant ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>Plus tard</AlertDialogCancel>
            <AlertDialogAction disabled={isStarting} onClick={() => void handleConfirmStart()}>
              {isStarting ? 'Démarrage…' : 'Commencer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
