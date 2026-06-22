import Dexie, { type EntityTable } from 'dexie'

export type SyncQueueItem = {
  id?: number
  type: 'insert_workout'
  payload: string
  createdAt: string
  attempts: number
}

export type ActiveWorkoutDraft = {
  id: 'current'
  title: string
  startedAt: string
  defaultRestSeconds?: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    muscleGroup?: string | null
    equipment?: string | null
    supersetId?: number | null
    sets: Array<{
      setIndex: number
      setType: 'normal' | 'warmup' | 'failure'
      weightKg: number | null
      reps: number | null
      restSeconds?: number | null
      durationSeconds?: number | null
      distanceKm?: number | null
      rpe?: number | null
    }>
  }>
}

class RCoachDB extends Dexie {
  syncQueue!: EntityTable<SyncQueueItem, 'id'>
  activeDraft!: EntityTable<ActiveWorkoutDraft, 'id'>

  constructor() {
    super('rcoach-v2')

    this.version(1).stores({
      syncQueue: '++id, type, createdAt',
      activeDraft: 'id',
    })
  }
}

export const db = new RCoachDB()
