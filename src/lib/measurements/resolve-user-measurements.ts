import type { NutritionSettings } from '@/lib/nutrition/types'

import type { StoredUserMeasurements, UserMeasurements } from './types'

export type NutritionMeasurementsFallback = Pick<
  NutritionSettings,
  'sex' | 'age' | 'height_cm'
>

export function resolveUserMeasurements(
  measurements: UserMeasurements | StoredUserMeasurements | null | undefined,
  nutritionSettings: NutritionMeasurementsFallback | null | undefined,
): StoredUserMeasurements | null {
  const sex = measurements?.sex ?? nutritionSettings?.sex ?? null
  const age = measurements?.age ?? nutritionSettings?.age ?? null
  const height_cm = measurements?.height_cm ?? nutritionSettings?.height_cm ?? null
  const waist_cm = measurements?.waist_cm ?? null

  if (
    sex == null &&
    age == null &&
    height_cm == null &&
    waist_cm == null
  ) {
    return null
  }

  return { sex, age, height_cm, waist_cm }
}

export function hasResolvedBodyMeasurements(
  measurements: UserMeasurements | StoredUserMeasurements | null | undefined,
  nutritionSettings: NutritionMeasurementsFallback | null | undefined,
) {
  const resolved = resolveUserMeasurements(measurements, nutritionSettings)

  return (
    resolved?.sex != null &&
    resolved?.age != null &&
    resolved?.height_cm != null
  )
}

export function hasAnyResolvedMeasurements(
  measurements: UserMeasurements | StoredUserMeasurements | null | undefined,
  nutritionSettings: NutritionMeasurementsFallback | null | undefined,
) {
  const resolved = resolveUserMeasurements(measurements, nutritionSettings)

  if (!resolved) {
    return false
  }

  return (
    resolved.sex != null ||
    resolved.age != null ||
    resolved.height_cm != null ||
    resolved.waist_cm != null
  )
}
