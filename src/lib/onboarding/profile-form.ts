import type { NutritionSex } from '@/lib/nutrition/types'

export type ProfileOnboardingFormData = {
  sex: NutritionSex | null
  age: string
  heightCm: string
  weightKg: string
}

export function createEmptyProfileOnboardingForm(): ProfileOnboardingFormData {
  return {
    sex: null,
    age: '',
    heightCm: '',
    weightKg: '',
  }
}

export function buildNutritionUpsertFromOnboarding(data: ProfileOnboardingFormData) {
  const payload: {
    sex?: NutritionSex
    age?: number
    height_cm?: number
    weight_kg?: number
  } = {}

  if (data.sex) {
    payload.sex = data.sex
  }

  const age = Number.parseInt(data.age, 10)
  if (Number.isFinite(age) && age > 0) {
    payload.age = age
  }

  const heightCm = Number.parseFloat(data.heightCm.replace(',', '.'))
  if (Number.isFinite(heightCm) && heightCm > 0) {
    payload.height_cm = heightCm
  }

  const weightKg = Number.parseFloat(data.weightKg.replace(',', '.'))
  if (Number.isFinite(weightKg) && weightKg > 0) {
    payload.weight_kg = weightKg
  }

  return payload
}

export function hasOnboardingBodyData(data: ProfileOnboardingFormData) {
  return Object.keys(buildNutritionUpsertFromOnboarding(data)).length > 0
}
