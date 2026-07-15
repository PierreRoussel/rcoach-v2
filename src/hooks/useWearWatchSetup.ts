import { Capacitor } from '@capacitor/core'
import { useCallback, useEffect, useState } from 'react'

import {
  formatWearWatchStatusLabel,
  getWearWatchStatus,
  promptWearAppInstall,
  type WearWatchStatus,
} from '@/lib/wear/wear-bridge'

const POLL_INTERVAL_MS = 3_000

export function useWearWatchSetup(enabled = true) {
  const [status, setStatus] = useState<WearWatchStatus>({
    available: false,
    paired: false,
    hasRcoachWear: false,
  })
  const [isPromptingInstall, setIsPromptingInstall] = useState(false)
  const [installMessage, setInstallMessage] = useState<string | null>(null)

  const isAndroidNative =
    enabled && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

  const refreshStatus = useCallback(async () => {
    if (!isAndroidNative) {
      return
    }

    setStatus(await getWearWatchStatus())
  }, [isAndroidNative])

  useEffect(() => {
    if (!isAndroidNative) {
      return
    }

    void refreshStatus()
    const timer = setInterval(() => {
      void refreshStatus()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isAndroidNative, refreshStatus])

  const needsWearInstall = isAndroidNative && status.paired && !status.hasRcoachWear

  const installOnWatch = useCallback(async () => {
    if (!needsWearInstall) {
      return
    }

    setIsPromptingInstall(true)
    setInstallMessage(null)

    try {
      const result = await promptWearAppInstall()
      if (result.launched) {
        setInstallMessage(
          'Play Store ouvert sur la montre — confirmez l’installation sur la montre.',
        )
      } else if (result.reason === 'no_paired_watch') {
        setInstallMessage('Aucune montre connectée. Vérifiez le Bluetooth et l’app Wear OS.')
      } else {
        setInstallMessage('Impossible d’ouvrir le Play Store sur la montre. Réessayez.')
      }
    } finally {
      setIsPromptingInstall(false)
      void refreshStatus()
    }
  }, [needsWearInstall, refreshStatus])

  return {
    isSupported: isAndroidNative,
    status,
    statusLabel: formatWearWatchStatusLabel(status),
    needsWearInstall,
    isPromptingInstall,
    installMessage,
    installOnWatch,
    refreshStatus,
  }
}
