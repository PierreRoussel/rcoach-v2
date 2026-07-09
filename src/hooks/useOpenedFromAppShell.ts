export function useOpenedFromAppShell() {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('from') === 'app'
}
