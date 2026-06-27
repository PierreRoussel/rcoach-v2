import type { NhostClient } from '@nhost/nhost-js'
import { generateServiceUrl } from '@nhost/nhost-js'

export const EXERCISE_DEMO_BUCKET_ID = 'exercise-demos'

function getStorageBaseUrl(nhost: NhostClient): string {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
  const region = import.meta.env.VITE_NHOST_REGION

  return (
    nhost.storage.baseURL || generateServiceUrl('storage', subdomain, region)
  )
}

export function getExerciseDemoFileUrl(
  nhost: NhostClient,
  fileId: string | null | undefined,
): string | null {
  if (!fileId) {
    return null
  }

  return `${getStorageBaseUrl(nhost)}/files/${fileId}`
}

export function getMuscleFallbackPosterPath(
  muscleGroup: string | null | undefined,
): string {
  const normalized = (muscleGroup ?? 'full_body').toLowerCase()
  const allowed = new Set([
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'legs',
    'glutes',
    'abs',
    'full_body',
    'cardio',
  ])

  const key = allowed.has(normalized) ? normalized : 'full_body'
  return `/exercise-fallbacks/${key}.svg`
}
