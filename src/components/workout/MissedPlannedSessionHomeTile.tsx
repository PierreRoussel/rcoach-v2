import { useMemo, useState } from 'react'
import { Play, Sparkles } from 'lucide-react'
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
import { HomeNotificationTile } from '@/design-system'
import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useMyWorkoutsInRange } from '@/hooks/useWorkouts'
import { getYesterdayMissedOccurrences } from '@/lib/schedule/missed-occurrences'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

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

  return `${label} — tu peux encore la rattraper aujourd'hui${suffix}`
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
      <HomeNotificationTile
        tone="encouraging"
        eyebrow="Encore le temps"
        title={formatMissedSessionMessage(missedOccurrences)}
        actionLabel="Lancer la séance"
        actionIcon={Play}
        icon={Sparkles}
        ariaLabel={`Rattraper la séance : ${sessionLabel}`}
        onClick={() => setConfirmOpen(true)}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rattraper la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bonne idée de boucler{' '}
              <span className="font-semibold text-foreground">{sessionLabel}</span> aujourd&apos;hui.
              On démarre ?
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
