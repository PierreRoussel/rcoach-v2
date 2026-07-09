import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useCallback, useEffect, useState } from 'react'

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported')

  const refresh = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermission('unsupported')
      return
    }

    const result = await LocalNotifications.checkPermissions()
    if (result.display === 'granted') {
      setPermission('granted')
      return
    }

    if (result.display === 'denied') {
      setPermission('denied')
      return
    }

    setPermission('prompt')
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const requestPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return false
    }

    const result = await LocalNotifications.requestPermissions()
    const granted = result.display === 'granted'
    setPermission(granted ? 'granted' : 'denied')
    return granted
  }, [])

  return {
    permission,
    requestPermission,
    refresh,
    isSupported: Capacitor.isNativePlatform(),
  }
}
