import type { NutritionSex } from '@/lib/nutrition/types'

import type { StoredUserMeasurements } from '@/lib/measurements/types'

export type ProfileOnboardingFormData = {
  sex: NutritionSex | null
  age: string
  heightCm: string
  waistCm: string
  weightKg: string
}

export function createEmptyProfileOnboardingForm(): ProfileOnboardingFormData {
  return {
    sex: null,
    age: '',
    heightCm: '',
    waistCm: '',
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
  measurements: StoredUserMeasurements | null | undefined,
  weightKg: number | null | undefined,
): ProfileOnboardingFormData {
  return {
    sex: measurements?.sex ?? null,
    age: formatStoredMetric(measurements?.age),
    heightCm: formatStoredMetric(measurements?.height_cm),
    waistCm: formatStoredMetric(measurements?.waist_cm),
    weightKg: formatStoredMetric(weightKg),
  }
}

export function hasCompleteOnboardingBodyData(data: ProfileOnboardingFormData) {
  return (
    data.sex != null &&
    data.age.trim() !== '' &&
    data.heightCm.trim() !== '' &&
    data.waistCm.trim() !== ''
  )
}

export function hasStoredOnboardingBodyData(
  measurements: StoredUserMeasurements | null | undefined,
) {
  if (!measurements) {
    return false
  }

  return (
    measurements.sex != null &&
    measurements.age != null &&
    measurements.height_cm != null &&
    measurements.waist_cm != null
  )
}

export function buildUserMeasurementsUpsertFromOnboarding(
  data: ProfileOnboardingFormData,
) {
  const payload: {
    sex?: NutritionSex
    age?: number
    height_cm?: number
    waist_cm?: number
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

  const waistCm = Number.parseFloat(data.waistCm.replace(',', '.'))
  if (Number.isFinite(waistCm) && waistCm > 0) {
    payload.waist_cm = waistCm
  }

  return payload
}

export function parseOnboardingWeightKg(data: ProfileOnboardingFormData) {
  const weightKg = Number.parseFloat(data.weightKg.replace(',', '.'))
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return null
  }

  return weightKg
}

export function hasOnboardingBodyData(data: ProfileOnboardingFormData) {
  return (
    Object.keys(buildUserMeasurementsUpsertFromOnboarding(data)).length > 0 ||
    parseOnboardingWeightKg(data) != null
  )
}

export function buildWizardMeasurementsUpsert(input: {
  sex: NutritionSex
  age: string
  heightCm: string
}) {
  const payload: {
    sex?: NutritionSex
    age?: number
    height_cm?: number
  } = {
    sex: input.sex,
  }

  const age = Number.parseInt(input.age, 10)
  if (Number.isFinite(age) && age > 0) {
    payload.age = age
  }

  const heightCm = Number.parseFloat(input.heightCm.replace(',', '.'))
  if (Number.isFinite(heightCm) && heightCm > 0) {
    payload.height_cm = heightCm
  }

  return payload
}
