const HEALTH_CONNECT_ENABLED_KEY = 'rcoach:health_connect_enabled'

export function isHealthConnectSyncEnabled() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(HEALTH_CONNECT_ENABLED_KEY) === 'true'
}

export function setHealthConnectSyncEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HEALTH_CONNECT_ENABLED_KEY, enabled ? 'true' : 'false')
}
