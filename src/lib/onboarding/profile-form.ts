import type { NutritionSex } from '@/lib/nutrition/types'

export type ProfileOnboardingFormData = {
  sex: NutritionSex | null
  age: string
  heightCm: string
  weightKg: string
}

export type StoredOnboardingBodyData = {
  sex?: NutritionSex | null
  age?: number | null
  height_cm?: number | null
  weight_kg?: number | null
}

export function createEmptyProfileOnboardingForm(): ProfileOnboardingFormData {
  return {
    sex: null,
    age: '',
    heightCm: '',
    weightKg: '',
  }
}

function formatStoredMetric(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return ''
  }

  return String(value)
}

export function profileOnboardingFormFromStoredBodyData(
  stored: StoredOnboardingBodyData | null | undefined,
): ProfileOnboardingFormData {
  return {
    sex: stored?.sex ?? null,
    age: formatStoredMetric(stored?.age),
    heightCm: formatStoredMetric(stored?.height_cm),
    weightKg: formatStoredMetric(stored?.weight_kg),
  }
}

export function hasCompleteOnboardingBodyData(data: ProfileOnboardingFormData) {
  return (
    data.sex != null &&
    data.age.trim() !== '' &&
    data.heightCm.trim() !== '' &&
    data.weightKg.trim() !== ''
  )
}

export function hasStoredOnboardingBodyData(
  stored: StoredOnboardingBodyData | null | undefined,
) {
  return hasCompleteOnboardingBodyData(profileOnboardingFormFromStoredBodyData(stored))
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
