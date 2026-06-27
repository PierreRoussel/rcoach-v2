import Dexie, { type EntityTable } from 'dexie'

import type { Food } from '@/lib/nutrition/types'

export type SyncQueueItem = {
  id?: number
  type:
    | 'insert_workout'
    | 'insert_meal_entry'
    | 'update_meal_entry'
    | 'delete_meal_entry'
    | 'upsert_food'
  payload: string
  createdAt: string
  attempts: number
}

export type NutritionDayCache = {
  id: string
  userId: string
  date: string
  entries: Array<Record<string, unknown> & { id: string; pending?: boolean }>
  updatedAt: string
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
  nutritionDayCache!: EntityTable<NutritionDayCache, 'id'>
  foodsCache!: EntityTable<Food, 'id'>

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

    this.version(3).stores({
      syncQueue: '++id, type, createdAt',
      activeDraft: 'id',
      nutritionDayCache: 'date',
    })

    this.version(4).stores({
      syncQueue: '++id, type, createdAt',
      activeDraft: 'id',
      nutritionDayCache: 'date',
      foodsCache: 'id, name, barcode, off_product_id',
    })

    this.version(5).stores({
      syncQueue: '++id, type, createdAt',
      activeDraft: 'id',
      nutritionDayCache: null,
      foodsCache: 'id, name, barcode, off_product_id',
    })

    this.version(6).stores({
      syncQueue: '++id, type, createdAt',
      activeDraft: 'id',
      nutritionDayCache: 'id, userId, date',
      foodsCache: 'id, name, barcode, off_product_id',
    })

    this.version(7)
      .stores({
        syncQueue: '++id, type, createdAt',
        activeDraft: 'id',
        nutritionDayCache: 'id, userId, date',
        foodsCache: 'id, name, barcode, off_product_id',
      })
      .upgrade(async (transaction) => {
        await transaction.table('nutritionDayCache').clear()
      })
  }
}

export const db = new RCoachDB()
