import type { NutritionSex } from '@/lib/nutrition/types'

export type UserMeasurements = {
  user_id: string
  sex: NutritionSex | null
  age: number | null
  height_cm: number | null
  waist_cm: number | null
  created_at: string
  updated_at: string
}

export type UserMeasurementsInput = {
  sex?: NutritionSex | null
  age?: number | null
  height_cm?: number | null
  waist_cm?: number | null
}

export type StoredUserMeasurements = Pick<
  UserMeasurements,
  'sex' | 'age' | 'height_cm' | 'waist_cm'
>

export function hasCompleteUserMeasurements(
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

export function hasPartialUserMeasurements(
  measurements: StoredUserMeasurements | null | undefined,
) {
  if (!measurements) {
    return false
  }

  return (
    measurements.sex != null ||
    measurements.age != null ||
    measurements.height_cm != null ||
    measurements.waist_cm != null
  )
}
