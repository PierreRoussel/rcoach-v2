import { useEffect, useRef, useState } from 'react'

import { BarcodeScannerShell } from '@/components/nutrition/BarcodeScannerShell'
import {
  isPwaBarcodeScanSupported,
  mapPwaCameraError,
  startPwaBarcodeScan,
  type PwaBarcodeScanSession,
} from '@/lib/nutrition/pwa-barcode-scanner'

type PwaBarcodeScannerOverlayProps = {
  open: boolean
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function PwaBarcodeScannerOverlay({
  open,
  onDetected,
  onClose,
}: PwaBarcodeScannerOverlayProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const sessionRef = useRef<PwaBarcodeScanSession | null>(null)
  const handledRef = useRef(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      sessionRef.current?.stop()
      sessionRef.current = null
      setVideoElement(null)
      setStatus('idle')
      setErrorMessage(null)
      handledRef.current = false
      return
    }

    if (!videoElement) {
      return
    }

    const video = videoElement
    let cancelled = false

    async function startScanner() {
      setStatus('starting')
      setErrorMessage(null)
      handledRef.current = false

      try {
        const supported = await isPwaBarcodeScanSupported()
        if (!supported) {
          throw new Error('Scanner non disponible sur ce navigateur.')
        }

        if (cancelled) {
          return
        }

        sessionRef.current = await startPwaBarcodeScan(video, (barcode) => {
          if (handledRef.current) {
            return
          }

          handledRef.current = true
          sessionRef.current?.stop()
          sessionRef.current = null
          onDetected(barcode)
        })

        if (!cancelled) {
          setStatus('scanning')
        }
      } catch (error) {
        sessionRef.current?.stop()
        sessionRef.current = null

        if (!cancelled) {
          setStatus('error')
          setErrorMessage(mapPwaCameraError(error))
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      sessionRef.current?.stop()
      sessionRef.current = null
    }
  }, [onDetected, open, videoElement])

  function handleClose() {
    sessionRef.current?.stop()
    sessionRef.current = null
    onClose()
  }

  return (
    <BarcodeScannerShell
      open={open}
      onClose={handleClose}
      status={status}
      errorMessage={errorMessage}
      video={
        <video
          ref={setVideoElement}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          autoPlay
        />
      }
    />
  )
}
