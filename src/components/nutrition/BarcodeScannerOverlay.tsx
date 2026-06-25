import { Capacitor } from '@capacitor/core'
import {
  BarcodeScanner,
  LensFacing,
  type PluginListenerHandle,
} from '@capacitor-mlkit/barcode-scanning'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FOOD_BARCODE_FORMATS } from '@/lib/nutrition/barcode-formats'
import { cn } from '@/lib/utils'

type BarcodeScannerOverlayProps = {
  open: boolean
  onDetected: (barcode: string) => void
  onClose: () => void
}

async function ensureWebBarcodeDetector() {
  if (typeof window === 'undefined' || 'BarcodeDetector' in window) {
    return
  }

  await import('barcode-detector/ponyfill')
}

async function stopScannerSession() {
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

export function BarcodeScannerOverlay({ open, onDetected, onClose }: BarcodeScannerOverlayProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const listenerRef = useRef<PluginListenerHandle | null>(null)
  const handledRef = useRef(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    if (!open) {
      setVideoElement(null)
      setStatus('idle')
      setErrorMessage(null)
      handledRef.current = false
      return
    }

    if (!isNative && !videoElement) {
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
          if (!isNative) {
            await ensureWebBarcodeDetector()
            const { supported: supportedAfterPolyfill } = await BarcodeScanner.isSupported()
            if (!supportedAfterPolyfill) {
              throw new Error('Scanner non disponible sur ce navigateur.')
            }
          } else {
            throw new Error('Scanner non disponible sur cet appareil.')
          }
        }

        const permission = await BarcodeScanner.checkPermissions()
        if (permission.camera !== 'granted') {
          const requested = await BarcodeScanner.requestPermissions()
          if (requested.camera !== 'granted') {
            throw new Error('Permission caméra refusée.')
          }
        }

        if (cancelled) {
          return
        }

        if (isNative) {
          document.body.classList.add('barcode-scanner-active')
        }

        listenerRef.current = await BarcodeScanner.addListener('barcodesScanned', (event) => {
          if (handledRef.current) {
            return
          }

          const barcode = event.barcodes[0]?.rawValue?.trim()
          if (!barcode) {
            return
          }

          handledRef.current = true
          void stopScannerSession().finally(() => onDetected(barcode))
        })

        const videoElementOption = !isNative ? videoElement ?? undefined : undefined
        if (!isNative && !videoElementOption) {
          throw new Error("Impossible d'initialiser la caméra.")
        }

        await BarcodeScanner.startScan({
          formats: FOOD_BARCODE_FORMATS,
          lensFacing: LensFacing.Back,
          videoElement: videoElementOption,
        })

        if (!cancelled) {
          setStatus('scanning')
        }
      } catch (error) {
        await stopScannerSession()
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
      void stopScannerSession()
      void listenerRef.current?.remove()
      listenerRef.current = null
    }
  }, [isNative, onDetected, open, videoElement])

  async function handleClose() {
    await stopScannerSession()
    onClose()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="barcode-scanner-modal fixed inset-0 z-[100] flex flex-col bg-black">
      {!isNative ? (
        <video
          ref={setVideoElement}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          autoPlay
        />
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-white/20 bg-black/40 text-white hover:bg-black/60"
            onClick={() => void handleClose()}
            aria-label="Fermer le scanner"
          >
            <X className="size-5" />
          </Button>
          <p className="font-display text-sm font-bold text-white">Scanner un code-barres</p>
          <div className="size-10" />
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div
            className={cn(
              'relative aspect-[4/3] w-full max-w-sm rounded-2xl border-2 border-white/70',
              isNative ? 'bg-transparent' : 'bg-black/20',
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-white/20" />
          </div>
        </div>

        <div className="space-y-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
          {status === 'starting' ? (
            <p className="text-sm text-white/80">Ouverture de la caméra...</p>
          ) : status === 'error' ? (
            <p className="text-sm text-red-300">{errorMessage}</p>
          ) : (
            <p className="text-sm text-white/80">
              Placez le code-barres dans le cadre. La détection est automatique.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
