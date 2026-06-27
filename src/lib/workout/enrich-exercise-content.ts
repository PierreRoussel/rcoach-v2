import { generateServiceUrl } from '@nhost/nhost-js'
import type { NhostClient } from '@nhost/nhost-js'

function resolveEnrichFunctionUrl(): string | null {
  const configured = import.meta.env.VITE_ENRICH_EXERCISE_FUNCTION_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN?.trim()
  const region = import.meta.env.VITE_NHOST_REGION?.trim()
  if (!subdomain || !region || subdomain === 'local') {
    return null
  }

  return `https://${subdomain}.functions.${region}.nhost.run/v1/enrich-exercise-content`
}

export async function requestExerciseContentEnrichment(
  nhost: NhostClient,
  exerciseId: string,
): Promise<void> {
  const functionUrl = resolveEnrichFunctionUrl()
  if (!functionUrl) {
    return
  }

  const session = nhost.getUserSession()
  const accessToken = session?.accessToken
  if (!accessToken) {
    return
  }

  try {
    await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exerciseId }),
    })
  } catch {
    // Fire-and-forget enrichment; drawer falls back to templates.
  }
}

export function getExerciseDemoStorageBase(nhost: NhostClient): string {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
  const region = import.meta.env.VITE_NHOST_REGION
  return nhost.storage.baseURL || generateServiceUrl('storage', subdomain, region)
}
