import { INSERT_WORKOUT } from '@/lib/graphql/operations'
import { flushNutritionSyncQueue } from '@/lib/graphql/nutrition-sync-queue'
import { graphqlRequest } from '@/lib/graphql/request'
import { db } from '@/lib/db/dexie'
import type { NhostClient } from '@nhost/nhost-js'

export async function enqueueWorkoutInsert(payload: object) {
  await db.syncQueue.add({
    type: 'insert_workout',
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    attempts: 0,
  })
}

export async function flushSyncQueue(nhost: NhostClient) {
  const pending = await db.syncQueue.orderBy('createdAt').toArray()

  for (const item of pending) {
    if (item.type !== 'insert_workout') {
      continue
    }

    try {
      const object = JSON.parse(item.payload) as object
      await graphqlRequest(nhost, INSERT_WORKOUT, { object })
      if (item.id != null) {
        await db.syncQueue.delete(item.id)
      }
    } catch {
      if (item.id != null) {
        await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
      }
    }
  }

  await flushNutritionSyncQueue(nhost)
}

export async function syncWorkoutDraft(
  nhost: NhostClient,
  draft: {
    title: string
    startedAt: string
    workoutTemplateId?: string | null
    exercises: Array<{
      exerciseId: string
      sets: Array<{
        setIndex: number
        setType: string
        weightKg: number | null
        reps: number | null
        rpe?: number | null
        durationSeconds?: number | null
      }>
    }>
  },
): Promise<string> {
  const endedAt = new Date().toISOString()
  const object = {
    title: draft.title,
    started_at: draft.startedAt,
    ended_at: endedAt,
    workout_template_id: draft.workoutTemplateId ?? null,
    workout_exercises: {
      data: draft.exercises.map((exercise, sortOrder) => ({
        sort_order: sortOrder,
        exercise_id: exercise.exerciseId,
        sets: {
          data: exercise.sets.map((set) => ({
            set_index: set.setIndex,
            set_type: set.setType,
            weight_kg: set.weightKg,
            reps: set.reps,
            rpe: set.rpe ?? null,
            duration_seconds: set.durationSeconds ?? null,
          })),
        },
      })),
    },
  }

  try {
    const data = await graphqlRequest<{ insert_workouts_one: { id: string } }>(
      nhost,
      INSERT_WORKOUT,
      { object },
    )
    return data.insert_workouts_one.id
  } catch {
    await enqueueWorkoutInsert(object)
    throw new Error('Synchronisation reportée — réessayez quand vous serez en ligne.')
  }
}
