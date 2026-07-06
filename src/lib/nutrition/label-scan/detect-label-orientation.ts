import {
  osdOrientationToClockwiseRotation,
  type LabelImageRotation,
} from '@/lib/nutrition/label-scan/label-image-rotation'

const MIN_OSD_CONFIDENCE = 2

type OrientationDetection = {
  rotation: LabelImageRotation
  confidence: number
}

async function downscaleForOrientationDetection(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const maxEdge = 1_200
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return source
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88)
  })

  return blob ?? source
}

export async function detectLabelImageRotation(source: Blob): Promise<OrientationDetection | null> {
  try {
    const { createWorker, OEM } = await import('tesseract.js')
    const sample = await downscaleForOrientationDetection(source)
    const worker = await createWorker('osd', OEM.TESSERACT_ONLY, {
      legacyCore: true,
      legacyLang: true,
      errorHandler: () => {},
    })

    try {
      await worker.setParameters({ user_defined_dpi: '300' })
      const { data } = await worker.detect(sample)
      const orientationDegrees = Number(data.orientation_degrees ?? 0)
      const confidence = Number(data.orientation_confidence ?? 0)

      if (!Number.isFinite(orientationDegrees) || confidence < MIN_OSD_CONFIDENCE) {
        return null
      }

      return {
        rotation: osdOrientationToClockwiseRotation(orientationDegrees),
        confidence,
      }
    } finally {
      await worker.terminate()
    }
  } catch {
    return null
  }
}
