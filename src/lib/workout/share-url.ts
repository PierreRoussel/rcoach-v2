import { resolvePublicAppOrigin } from '@/lib/app/public-origin'

export function buildWorkoutShareUrl(shareToken: string) {
  return `${resolvePublicAppOrigin()}/share/workout/${shareToken}`
}
