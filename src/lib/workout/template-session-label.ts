import { normalizeSessionMode, type SessionMode } from '@/lib/workout/session-mode'

export function getTemplateSessionLabel(sessionMode: unknown): string | null {
  return normalizeSessionMode(sessionMode) === 'emom' ? 'EMOM' : null
}

export function formatEmomTemplateMeta(
  sessionMode: unknown,
  emomTotalMinutes?: number | null,
  emomIntervalSeconds?: number | null,
): string | null {
  if (normalizeSessionMode(sessionMode) !== 'emom') {
    return null
  }

  const minutes = emomTotalMinutes ?? 12
  const interval = emomIntervalSeconds ?? 60
  return `${minutes} min · ${interval}s/min`
}

export function isEmomSessionMode(sessionMode: unknown): sessionMode is SessionMode {
  return normalizeSessionMode(sessionMode) === 'emom'
}
