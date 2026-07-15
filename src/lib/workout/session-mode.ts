export type SessionMode = 'circuit' | 'emom'

export const DEFAULT_SESSION_MODE: SessionMode = 'circuit'

export const DEFAULT_EMOM_INTERVAL_SECONDS = 60

export function normalizeSessionMode(value: unknown): SessionMode {
  return value === 'emom' ? 'emom' : 'circuit'
}
