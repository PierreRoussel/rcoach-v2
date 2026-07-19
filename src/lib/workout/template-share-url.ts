import { resolvePublicAppOrigin } from '@/lib/app/public-origin'

export function buildTemplateShareUrl(shareToken: string) {
  return `${resolvePublicAppOrigin()}/share/template/${shareToken}`
}
