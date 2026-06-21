import { INSERT_WORKOUT } from '@/lib/graphql/operations'
import type { NhostClient } from '@nhost/nhost-js'

export async function insertSampleWorkout(
  nhost: NhostClient,
  exerciseId: string,
) {
  const now = new Date().toISOString()

  const response = await nhost.graphql.request<{
    insert_workouts_one: { id: string; title: string } | null
  }>({
    query: INSERT_WORKOUT,
    variables: {
      object: {
        title: 'Seance test Phase 0',
        started_at: now,
        ended_at: now,
        workout_exercises: {
          data: [
            {
              sort_order: 0,
              exercise_id: exerciseId,
              sets: {
                data: [
                  {
                    set_index: 0,
                    set_type: 'normal',
                    weight_kg: 60,
                    reps: 8,
                  },
                ],
              },
            },
          ],
        },
      },
    },
  })

  if (response.body.errors?.length) {
    throw new Error(response.body.errors[0]?.message ?? 'Workout insert failed')
  }

  return response.body.data?.insert_workouts_one
}
