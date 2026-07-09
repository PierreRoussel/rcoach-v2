import { LEGAL_PATHS } from '@/lib/legal/config'

const STANDALONE_DOCUMENT_PATHS = new Set<string>([
  LEGAL_PATHS.help,
  LEGAL_PATHS.about,
  LEGAL_PATHS.privacy,
  LEGAL_PATHS.terms,
  LEGAL_PATHS.cgv,
  LEGAL_PATHS.mentions,
])

export function normalizeDocumentPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

export function isStandaloneDocumentPath(path: string) {
  return STANDALONE_DOCUMENT_PATHS.has(normalizeDocumentPath(path))
}

export function standaloneDocumentHref(
  path: string,
  options?: { fromApp?: boolean },
) {
  const normalized = normalizeDocumentPath(path)
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://rcoach.fr'
  const url = new URL(normalized, origin)

  if (options?.fromApp) {
    url.searchParams.set('from', 'app')
  }

  return url.toString()
}

export function openStandaloneDocument(
  path: string,
  options?: { fromApp?: boolean },
) {
  window.open(
    standaloneDocumentHref(path, options),
    '_blank',
    'noopener,noreferrer',
  )
}
