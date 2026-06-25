import { useCallback, useRef, useState } from 'react'

import { BarcodeScannerOverlay } from '@/components/nutrition/BarcodeScannerOverlay'

export function useBarcodeScanner() {
  const [open, setOpen] = useState(false)
  const resolveRef = useRef<((value: string | null) => void) | null>(null)

  const requestScan = useCallback(() => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve
      setOpen(true)
    })
  }, [])

  const finish = useCallback((barcode: string | null) => {
    resolveRef.current?.(barcode)
    resolveRef.current = null
    setOpen(false)
  }, [])

  const scanner = (
    <BarcodeScannerOverlay
      open={open}
      onDetected={(barcode) => finish(barcode)}
      onClose={() => finish(null)}
    />
  )

  return { requestScan, scanner }
}
