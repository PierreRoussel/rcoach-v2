import Dexie, { type EntityTable } from 'dexie'

export type SyncQueueItem = {
  id?: number
  type: 'insert_workout'
  payload: string
  createdAt: string
  attempts: number
}

export type ActiveSetDraft = {
  setIndex: number
  setType: 'normal' | 'warmup' | 'failure'
  weightKg: number | null
  reps: number | null
  restSeconds?: number | null
  durationSeconds?: number | null
  distanceKm?: number | null
  rpe?: number | null
  completedAt: string | null
}

export type ActiveExerciseDraft = {
  exerciseId: string
  exerciseName: string
  muscleGroup?: string | null
  equipment?: string | null
  supersetId?: number | null
  defaultRestSeconds?: number
  sets: ActiveSetDraft[]
}

export type ActiveWorkoutDraft = {
  id: 'current'
  title: string
  startedAt: string
  defaultRestSeconds?: number
  sourceTemplateId?: string | null
  activeStepIndex?: number
  lastCompletedStep?: {
    exerciseIndex: number
    setIndex: number
  } | null
  exercises: ActiveExerciseDraft[]
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

    this.version(2)
      .stores({
        syncQueue: '++id, type, createdAt',
        activeDraft: 'id',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<ActiveWorkoutDraft, 'current'>('activeDraft')
          .toCollection()
          .modify((draft) => {
            draft.activeStepIndex = draft.activeStepIndex ?? 0

            for (const exercise of draft.exercises) {
              exercise.defaultRestSeconds =
                exercise.defaultRestSeconds ?? draft.defaultRestSeconds ?? 90

              for (const set of exercise.sets) {
                const legacySet = set as ActiveSetDraft & { completedAt?: string | null }
                legacySet.completedAt = legacySet.completedAt ?? null
              }
            }
          })
      })
  }
}

export const db = new RCoachDB()
