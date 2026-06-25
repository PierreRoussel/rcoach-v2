const PWA_BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
] as const

export type PwaBarcodeScanSession = {
  stop: () => void
}

async function ensureBarcodeDetector() {
  if (typeof window === 'undefined') {
    throw new Error('Scanner indisponible hors navigateur.')
  }

  if (!('BarcodeDetector' in window)) {
    await import('barcode-detector/ponyfill')
  }

  const BarcodeDetectorCtor = (
    window as Window & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
      }
    }
  ).BarcodeDetector

  if (!BarcodeDetectorCtor) {
    throw new Error('Scanner non disponible sur ce navigateur.')
  }

  return BarcodeDetectorCtor
}

export async function isPwaBarcodeScanSupported() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  try {
    await ensureBarcodeDetector()
    return true
  } catch {
    return false
  }
}

export async function startPwaBarcodeScan(
  video: HTMLVideoElement,
  onDetected: (barcode: string) => void,
): Promise<PwaBarcodeScanSession> {
  const BarcodeDetectorClass = await ensureBarcodeDetector()
  const detector = new BarcodeDetectorClass({ formats: [...PWA_BARCODE_FORMATS] })

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })

  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  await video.play()

  let stopped = false
  const intervalId = window.setInterval(() => {
    if (stopped || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return
    }

    void detector
      .detect(video)
      .then((barcodes) => {
        if (stopped) {
          return
        }

        const barcode = barcodes[0]?.rawValue?.trim()
        if (barcode) {
          stopped = true
          onDetected(barcode)
        }
      })
      .catch(() => {
        // ignore frame-level detection errors
      })
  }, 250)

  return {
    stop: () => {
      if (stopped) {
        return
      }

      stopped = true
      window.clearInterval(intervalId)
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    },
  }
}

export function mapPwaCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Permission camera refusee.'
    }

    if (error.name === 'NotFoundError') {
      return 'Aucune camera disponible sur cet appareil.'
    }

    if (error.name === 'NotReadableError') {
      return 'La camera est deja utilisee par une autre application.'
    }
  }

  return error instanceof Error ? error.message : "Impossible d'ouvrir la camera."
}
