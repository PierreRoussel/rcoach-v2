import type { StoredUserMeasurements, UserMeasurements } from './types'

export function resolveUserMeasurements(
  measurements: UserMeasurements | StoredUserMeasurements | null | undefined,
): StoredUserMeasurements | null {
  if (!measurements) {
    return null
  }

  const { sex, age, height_cm, waist_cm } = measurements

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
) {
  const resolved = resolveUserMeasurements(measurements)

  return (
    resolved?.sex != null &&
    resolved?.age != null &&
    resolved?.height_cm != null
  )
}

export function hasAnyResolvedMeasurements(
  measurements: UserMeasurements | StoredUserMeasurements | null | undefined,
) {
  const resolved = resolveUserMeasurements(measurements)

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
