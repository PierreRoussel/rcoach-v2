const STORAGE_KEY = 'premium-home-celebration-pending'

export function markPremiumHomeCelebrationPending(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // sessionStorage unavailable (private mode, etc.)
  }
}

export function consumePremiumHomeCelebrationPending(): boolean {
  try {
    if (sessionStorage.getItem(STORAGE_KEY) !== '1') {
      return false
    }
    sessionStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
