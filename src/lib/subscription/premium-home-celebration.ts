const STORAGE_KEY = 'premium-home-celebration-pending'

export function markPremiumHomeCelebrationPending(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // sessionStorage unavailable (private mode, etc.)
  }
}

export function hasPremiumHomeCelebrationPending(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function consumePremiumHomeCelebrationPending(): boolean {
  try {
    if (!hasPremiumHomeCelebrationPending()) {
      return false
    }
    sessionStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
