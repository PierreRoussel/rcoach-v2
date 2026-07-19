/**
 * Origin used for links shared outside the current WebView (SMS, WhatsApp, etc.).
 *
 * On Capacitor Android, `window.location.origin` is `https://localhost` — unusable for others.
 * Prefer `VITE_PUBLIC_APP_URL` (production PWA host), then fall back to the current origin.
 */
export function resolvePublicAppOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (configured) {
    return configured
  }

  if (typeof window === 'undefined') {
    return 'https://rcoach.fr'
  }

  const origin = window.location.origin
  if (isNonShareableOrigin(origin)) {
    return 'https://rcoach.fr'
  }

  return origin
}

function isNonShareableOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    )
  } catch {
    return true
  }
}
