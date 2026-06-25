import {
  BarcodeScanner,
  LensFacing,
  type PluginListenerHandle,
} from '@capacitor-mlkit/barcode-scanning'
import { useEffect, useRef, useState } from 'react'

import { BarcodeScannerShell } from '@/components/nutrition/BarcodeScannerShell'
import { FOOD_BARCODE_FORMATS } from '@/lib/nutrition/barcode-formats'

type NativeBarcodeScannerOverlayProps = {
  open: boolean
  onDetected: (barcode: string) => void
  onClose: () => void
}

async function stopNativeScannerSession() {
  document.body.classList.remove('barcode-scanner-active')

  try {
    await BarcodeScanner.removeAllListeners()
  } catch {
    // ignore cleanup errors
  }

  try {
    await BarcodeScanner.stopScan()
  } catch {
    // ignore cleanup errors
  }
}

export function NativeBarcodeScannerOverlay({
  open,
  onDetected,
  onClose,
}: NativeBarcodeScannerOverlayProps) {
  const listenerRef = useRef<PluginListenerHandle | null>(null)
  const handledRef = useRef(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setErrorMessage(null)
      handledRef.current = false
      return
    }

    let cancelled = false

    async function startScanner() {
      setStatus('starting')
      setErrorMessage(null)
      handledRef.current = false

      try {
        const { supported } = await BarcodeScanner.isSupported()
        if (!supported) {
          throw new Error('Scanner non disponible sur cet appareil.')
        }

        const permission = await BarcodeScanner.checkPermissions()
        if (permission.camera !== 'granted') {
          const requested = await BarcodeScanner.requestPermissions()
          if (requested.camera !== 'granted') {
            throw new Error('Permission camera refusee.')
          }
        }

        if (cancelled) {
          return
        }

        document.body.classList.add('barcode-scanner-active')

        listenerRef.current = await BarcodeScanner.addListener('barcodesScanned', (event) => {
          if (handledRef.current) {
            return
          }

          const barcode = event.barcodes[0]?.rawValue?.trim()
          if (!barcode) {
            return
          }

          handledRef.current = true
          void stopNativeScannerSession().finally(() => onDetected(barcode))
        })

        await BarcodeScanner.startScan({
          formats: FOOD_BARCODE_FORMATS,
          lensFacing: LensFacing.Back,
        })

        if (!cancelled) {
          setStatus('scanning')
        }
      } catch (error) {
        await stopNativeScannerSession()
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(
            error instanceof Error ? error.message : "Impossible d'ouvrir le scanner.",
          )
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      void stopNativeScannerSession()
      void listenerRef.current?.remove()
      listenerRef.current = null
    }
  }, [onDetected, open])

  async function handleClose() {
    await stopNativeScannerSession()
    onClose()
  }

  return (
    <BarcodeScannerShell
      open={open}
      onClose={() => void handleClose()}
      status={status}
      errorMessage={errorMessage}
      frameTransparent
    />
  )
}
