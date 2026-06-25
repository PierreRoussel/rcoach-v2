export function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) {
    return null
  }

  const colonMatch = /^(\d+):(\d{1,2})$/.exec(trimmed)
  if (colonMatch) {
    const minutes = Number(colonMatch[1])
    const seconds = Number(colonMatch[2])
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds
    }
  }

  const secondsSuffixMatch = /^(\d+)\s*s$/.exec(trimmed.replace(/\s+/g, ''))
  if (secondsSuffixMatch) {
    return Number(secondsSuffixMatch[1])
  }

  const numeric = Number(trimmed)
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.round(numeric)
  }

  return null
}

export function formatDurationInput(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) {
    return ''
  }

  return String(seconds)
}
