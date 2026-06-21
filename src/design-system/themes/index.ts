export type ThemeId = 'sports-candy'

export type ThemeDefinition = {
  id: ThemeId
  label: string
  description: string
}

export const themes: Record<ThemeId, ThemeDefinition> = {
  'sports-candy': {
    id: 'sports-candy',
    label: 'Sports Candy',
    description: 'Pastels vibrants pour une experience sportive mobile-first.',
  },
}

export const defaultThemeId: ThemeId = 'sports-candy'

export const themeIds = Object.keys(themes) as ThemeId[]
