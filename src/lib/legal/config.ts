const PLACEHOLDER_SIRET = 'SIRET à compléter'

export const LEGAL_PUBLISHER_NAME =
  import.meta.env.VITE_LEGAL_PUBLISHER_NAME ?? 'RCoach'

export const LEGAL_PUBLISHER_ADDRESS =
  import.meta.env.VITE_LEGAL_PUBLISHER_ADDRESS ?? 'Adresse à compléter'

export const LEGAL_SIRET = import.meta.env.VITE_LEGAL_SIRET ?? PLACEHOLDER_SIRET

export const LEGAL_HOSTING = 'Nhost Cloud (EU) · Cloudflare Pages'

export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@rcoach.fr'

export const LEGAL_BASE_URL =
  import.meta.env.VITE_LEGAL_BASE_URL ?? 'https://rcoach.fr'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.1.0'

export const LEGAL_LAST_UPDATED = '9 juillet 2026'

export const LEGAL_PATHS = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  cgv: '/legal/cgv',
  mentions: '/legal/mentions-legales',
  help: '/help',
  about: '/about',
} as const

export function isLegalConfigComplete() {
  return (
    LEGAL_SIRET !== PLACEHOLDER_SIRET &&
    LEGAL_PUBLISHER_ADDRESS !== 'Adresse à compléter'
  )
}

export function legalUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${LEGAL_BASE_URL.replace(/\/$/, '')}${normalized}`
}

export function supportMailto(subject?: string) {
  const params = new URLSearchParams()
  if (subject) {
    params.set('subject', subject)
  }
  const query = params.toString()
  return `mailto:${SUPPORT_EMAIL}${query ? `?${query}` : ''}`
}
