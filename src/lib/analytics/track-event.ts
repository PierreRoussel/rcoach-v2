type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, payload?: AnalyticsPayload): void {
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, payload ?? {})
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rcoach:analytics', {
        detail: { name, payload },
      }),
    )
  }
}
