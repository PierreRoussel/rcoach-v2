import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_MEAL_LOG_ENTRY,
  INSERT_MEAL_LOG_ENTRY,
  UPDATE_MEAL_LOG_ENTRY,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { buildPendingMealLogEntry, buildPendingQuickMealLogEntry } from '@/lib/nutrition/offline-meal-entry'
import { scaleNutrientsPer100g, type PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food, MealLogEntry, MealType } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  enqueueNutritionMutation,
  removeMealEntryFromDayCache,
  syncMealEntryInsert,
  syncMealEntryUpdate,
} from '@/lib/graphql/nutrition-sync-queue'

export type AddMealEntryInput = {
  loggedDate: string
  mealType: MealType
  food: Food
  portion: PortionInput
}

export type AddQuickMealEntryInput = {
  loggedDate: string
  mealType: MealType
  name: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}

export type MealMutationResult = {
  entry: MealLogEntry
  offline: boolean
}

function buildQuickMealEntryObject(input: AddQuickMealEntryInput) {
  return {
    logged_date: input.loggedDate,
    meal_type: input.mealType,
    food_id: null,
    custom_name: input.name.trim(),
    quantity_g: null,
    servings: null,
    calories: input.calories,
    carbs_g: input.carbsG,
    protein_g: input.proteinG,
    fat_g: input.fatG,
  }
}

function buildMealEntryObject(input: AddMealEntryInput) {
  const nutrients = scaleNutrientsPer100g(input.food, input.portion)

  return {
    logged_date: input.loggedDate,
    meal_type: input.mealType,
    food_id: input.food.id,
    quantity_g: input.portion.mode === 'grams' ? input.portion.quantityG : null,
    servings: input.portion.mode === 'servings' ? input.portion.servings : null,
    calories: nutrients.calories,
    carbs_g: nutrients.carbsG,
    protein_g: nutrients.proteinG,
    fat_g: nutrients.fatG,
  }
}

export function useMealLogMutations() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  const invalidate = async (date?: string) => {
    await queryClient.invalidateQueries({ queryKey: ['nutrition-day'] })
    await queryClient.invalidateQueries({ queryKey: ['frequent-foods'] })
    await queryClient.invalidateQueries({ queryKey: ['nutrition-log-history'] })
    await queryClient.invalidateQueries({ queryKey: ['nutrition-sync-pending'] })
    if (date) {
      await queryClient.invalidateQueries({ queryKey: ['nutrition-day', date] })
    }
  }

  const addEntry = useMutation({
    mutationFn: async (input: AddMealEntryInput): Promise<MealMutationResult> => {
      const object = buildMealEntryObject(input)

      try {
        const data = await graphqlRequest<{
          insert_meal_log_entries_one: MealLogEntry
        }>(nhost, INSERT_MEAL_LOG_ENTRY, { object })

        return {
          entry: data.insert_meal_log_entries_one,
          offline: false,
        }
      } catch {
        const entryId = await syncMealEntryInsert(nhost, {
          object,
          food: input.food,
        })

        return {
          entry: buildPendingMealLogEntry({
            id: entryId,
            userId: user?.id ?? 'offline',
            loggedDate: input.loggedDate,
            mealType: input.mealType,
            food: input.food,
            portion: input.portion,
          }),
          offline: true,
        }
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidate(variables.loggedDate)
    },
  })

  const addQuickEntry = useMutation({
    mutationFn: async (input: AddQuickMealEntryInput): Promise<MealMutationResult> => {
      const object = buildQuickMealEntryObject(input)

      try {
        const data = await graphqlRequest<{
          insert_meal_log_entries_one: MealLogEntry
        }>(nhost, INSERT_MEAL_LOG_ENTRY, { object })

        return {
          entry: data.insert_meal_log_entries_one,
          offline: false,
        }
      } catch {
        const entryId = await syncMealEntryInsert(nhost, { object })

        return {
          entry: buildPendingQuickMealLogEntry({
            id: entryId,
            userId: user?.id ?? 'offline',
            loggedDate: input.loggedDate,
            mealType: input.mealType,
            name: input.name,
            calories: input.calories,
            carbsG: input.carbsG,
            proteinG: input.proteinG,
            fatG: input.fatG,
          }),
          offline: true,
        }
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidate(variables.loggedDate)
    },
  })

  const updateEntry = useMutation({
    mutationFn: async (input: {
      id: string
      loggedDate: string
      mealType: MealType
      food: Food
      portion: PortionInput
    }): Promise<MealMutationResult> => {
      const nutrients = scaleNutrientsPer100g(input.food, input.portion)
      const changes = {
        quantity_g: input.portion.mode === 'grams' ? input.portion.quantityG : null,
        servings: input.portion.mode === 'servings' ? input.portion.servings : null,
        calories: nutrients.calories,
        carbs_g: nutrients.carbsG,
        protein_g: nutrients.proteinG,
        fat_g: nutrients.fatG,
      }

      try {
        const data = await graphqlRequest<{
          update_meal_log_entries_by_pk: MealLogEntry
        }>(nhost, UPDATE_MEAL_LOG_ENTRY, { id: input.id, changes })

        return {
          entry: data.update_meal_log_entries_by_pk,
          offline: false,
        }
      } catch {
        await syncMealEntryUpdate(nhost, input.id, changes)

        return {
          entry: buildPendingMealLogEntry({
            id: input.id,
            userId: user?.id ?? 'offline',
            loggedDate: input.loggedDate,
            mealType: input.mealType,
            food: input.food,
            portion: input.portion,
          }),
          offline: true,
        }
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidate(variables.loggedDate)
    },
  })

  const deleteEntry = useMutation({
    mutationFn: async (input: { id: string; loggedDate: string }) => {
      await removeMealEntryFromDayCache(input.id)

      try {
        const data = await graphqlRequest<{
          delete_meal_log_entries_by_pk: { id: string } | null
        }>(nhost, DELETE_MEAL_LOG_ENTRY, { id: input.id })

        if (!data.delete_meal_log_entries_by_pk) {
          return
        }
      } catch {
        await enqueueNutritionMutation('delete_meal_entry', { id: input.id })
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidate(variables.loggedDate)
    },
  })

  return { addEntry, addQuickEntry, updateEntry, deleteEntry }
}
