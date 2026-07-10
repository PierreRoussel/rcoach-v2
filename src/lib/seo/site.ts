import { LEGAL_BASE_URL } from '@/lib/legal/config'

export const SITE_NAME = 'RCoach'
export const SITE_URL = LEGAL_BASE_URL.replace(/\/$/, '')

export const SITE_DEFAULT_DESCRIPTION =
  'Application de musculation et nutrition : suivez vos séances, macros, objectifs et progressez avec vos amis.'

export const SITE_DEFAULT_OG_IMAGE = '/og-share-default.svg'

export const MARKETING_HEADER_NAV = [
  { label: 'Fonctionnalités', to: '/fonctionnalites' as const },
  { label: 'Tarifs', to: '/tarifs' as const },
  { label: 'Blog', to: '/blog' as const },
  { label: 'FAQ', to: '/' as const, hash: 'faq' as const },
] as const

export const MARKETING_NAV = [
  { label: 'Fonctionnalités', to: '/fonctionnalites' },
  { label: 'Musculation', to: '/application-musculation' },
  { label: 'Nutrition', to: '/application-nutrition' },
  { label: 'Coachs', to: '/pour-les-coachs' },
  { label: 'Tarifs', to: '/tarifs' },
  { label: 'Blog', to: '/blog' },
] as const

export const MARKETING_STATIC_PATHS = [
  '/',
  '/fonctionnalites',
  '/application-musculation',
  '/application-nutrition',
  '/pour-les-coachs',
  '/tarifs',
  '/blog',
  '/help',
  '/about',
  '/legal/privacy',
  '/legal/terms',
  '/legal/cgv',
  '/legal/mentions-legales',
] as const

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}
