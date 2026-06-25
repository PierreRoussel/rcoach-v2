import { Capacitor } from '@capacitor/core'

import { NativeBarcodeScannerOverlay } from '@/components/nutrition/NativeBarcodeScannerOverlay'
import { PwaBarcodeScannerOverlay } from '@/components/nutrition/PwaBarcodeScannerOverlay'

type BarcodeScannerOverlayProps = {
  open: boolean
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScannerOverlay(props: BarcodeScannerOverlayProps) {
  if (Capacitor.isNativePlatform()) {
    return <NativeBarcodeScannerOverlay {...props} />
  }

  return <PwaBarcodeScannerOverlay {...props} />
}
