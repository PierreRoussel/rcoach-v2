export type MotivationPresetKey = 'fire' | 'muscle' | 'clap' | 'custom'

export type MotivationPreset = {
  key: MotivationPresetKey
  emoji: string
  label: string
  defaultMessage: string
}

export const MOTIVATION_PRESETS: MotivationPreset[] = [
  {
    key: 'fire',
    emoji: '🔥',
    label: 'En feu',
    defaultMessage: 'Tu es en feu !',
  },
  {
    key: 'muscle',
    emoji: '💪',
    label: 'Force',
    defaultMessage: 'Continue comme ça !',
  },
  {
    key: 'clap',
    emoji: '👏',
    label: 'Bravo',
    defaultMessage: 'Bravo !',
  },
]

export const MAX_MOTIVATION_MESSAGE_LENGTH = 80

export function normalizeMotivationMessage(message: string): string {
  return message.trim().slice(0, MAX_MOTIVATION_MESSAGE_LENGTH)
}

export function isValidMotivationMessage(message: string): boolean {
  const normalized = normalizeMotivationMessage(message)
  return normalized.length > 0 && normalized.length <= MAX_MOTIVATION_MESSAGE_LENGTH
}
