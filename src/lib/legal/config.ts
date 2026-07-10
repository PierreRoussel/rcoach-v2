const PLACEHOLDER_SIRET = 'SIRET à compléter'

export const LEGAL_PUBLISHER_NAME =
  import.meta.env.VITE_LEGAL_PUBLISHER_NAME ?? 'RCoach'

export const LEGAL_PUBLISHER_ADDRESS =
  import.meta.env.VITE_LEGAL_PUBLISHER_ADDRESS ??
  '10 Grand Place, 62760 Pas-en-Artois, France'

export const LEGAL_SIREN =
  import.meta.env.VITE_LEGAL_SIREN ?? '917869810'

export const LEGAL_SIRET =
  import.meta.env.VITE_LEGAL_SIRET ?? '91786981000015'

export const LEGAL_VAT_NUMBER =
  import.meta.env.VITE_LEGAL_VAT_NUMBER ?? 'FR20917869810'

export const LEGAL_COMPANY_FORM =
  import.meta.env.VITE_LEGAL_COMPANY_FORM ?? 'Entrepreneur individuel'

export const LEGAL_ACTIVITY =
  import.meta.env.VITE_LEGAL_ACTIVITY ?? 'Programmation informatique (6201Z)'

export const LEGAL_FOUNDED_AT =
  import.meta.env.VITE_LEGAL_FOUNDED_AT ?? '27 juillet 2022'

export const LEGAL_HOSTING = 'Nhost Cloud (EU) · Cloudflare Pages'

export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@rcoach.fr'

export const LEGAL_BASE_URL =
  import.meta.env.VITE_LEGAL_BASE_URL ?? 'https://rcoach.fr'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.1.0'

export const LEGAL_LAST_UPDATED = '10 juillet 2026'

export const LEGAL_PATHS = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  cgv: '/legal/cgv',
  mentions: '/legal/mentions-legales',
  help: '/help',
  about: '/about',
} as const

function formatGroupedDigits(value: string, groups: number[]) {
  const digits = value.replace(/\D/g, '')
  let offset = 0
  const parts: string[] = []

  for (const size of groups) {
    const chunk = digits.slice(offset, offset + size)
    if (!chunk) {
      break
    }
    parts.push(chunk)
    offset += size
  }

  return parts.length > 0 ? parts.join(' ') : value
}

export function formatLegalSiren(value = LEGAL_SIREN) {
  return formatGroupedDigits(value, [3, 3, 3])
}

export function formatLegalSiret(value = LEGAL_SIRET) {
  return formatGroupedDigits(value, [3, 3, 3, 5])
}

export function isLegalConfigComplete() {
  return (
    LEGAL_SIRET !== PLACEHOLDER_SIRET &&
    LEGAL_PUBLISHER_ADDRESS !== 'Adresse à compléter' &&
    Boolean(LEGAL_SIREN) &&
    Boolean(LEGAL_VAT_NUMBER)
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
