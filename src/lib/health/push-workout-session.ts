import type { ActiveWorkoutDraft } from '@/lib/db/dexie'
import { writeHealthConnectExerciseSession } from '@/lib/health/health-connect-bridge'
import { isHealthConnectSyncEnabled } from '@/lib/health/health-connect-preferences'

export function buildWorkoutClientRecordId(draft: Pick<ActiveWorkoutDraft, 'title' | 'startedAt'>) {
  return `${draft.startedAt}:${draft.title}`
}

export async function pushWorkoutSession(
  draft: Pick<ActiveWorkoutDraft, 'title' | 'startedAt'>,
  endedAt: string,
) {
  if (!isHealthConnectSyncEnabled()) {
    return { pushed: false as const, reason: 'disabled' as const }
  }

  await writeHealthConnectExerciseSession({
    clientRecordId: buildWorkoutClientRecordId(draft),
    title: draft.title,
    startTime: draft.startedAt,
    endTime: endedAt,
    exerciseType: 'STRENGTH_TRAINING',
  })

  return { pushed: true as const }
}
