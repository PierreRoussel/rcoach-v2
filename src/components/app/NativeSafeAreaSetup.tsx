import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { useEffect } from 'react'

import { useTheme } from '@/design-system'

export function NativeSafeAreaSetup() {
  const { colorMode } = useTheme()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    document.documentElement.classList.add('capacitor-native')

    void SystemBars.setStyle({
      style: colorMode === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    })
  }, [colorMode])

  return null
}
