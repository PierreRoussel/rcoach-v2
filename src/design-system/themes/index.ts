import type { ColorModePreference } from '@/design-system/theme-provider'

export type ThemeId = 'sports-candy' | 'pro'

export type ThemeDefinition = {
  id: ThemeId
  label: string
  description: string
  preview: {
    background: string
    primary: string
    secondary: string
    accent: string
  }
  defaultColorModePreference?: ColorModePreference
  supportsColorModePreference?: boolean
}

export const themes: Record<ThemeId, ThemeDefinition> = {
  'sports-candy': {
    id: 'sports-candy',
    label: 'Sports Candy',
    description: 'Pastels vibrants pour une expérience sportive mobile-first.',
    preview: {
      background: '#f7f5fb',
      primary: '#5b9bd5',
      secondary: '#1aae8a',
      accent: '#e8b84b',
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    description: 'Contraste élevé, accents néon — pensé pour la performance.',
    preview: {
      background: '#0D1B2E',
      primary: '#FF4D00',
      secondary: '#00DFA2',
      accent: '#C8FF00',
    },
    defaultColorModePreference: 'dark',
    supportsColorModePreference: false,
  },
}

export const defaultThemeId: ThemeId = 'sports-candy'

export const themeIds = Object.keys(themes) as ThemeId[]

export function themeSupportsColorModePreference(themeId: ThemeId) {
  return themes[themeId].supportsColorModePreference !== false
}
