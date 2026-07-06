const TARGET_MIN_WIDTH = 1_600
const MIN_SOURCE_DIMENSION = 120

function enhanceContrast(gray: number): number {
  const normalized = gray / 255
  const contrasted = (normalized - 0.5) * 1.35 + 0.5
  return Math.max(0, Math.min(255, Math.round(contrasted * 255)))
}

async function loadOrientedBitmap(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: 'from-image' })
  } catch {
    return createImageBitmap(source)
  }
}

async function loadFlatBitmap(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source)
}

async function bitmapToJpeg(bitmap: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error("Impossible de préparer l'image.")
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) {
    throw new Error("Impossible de préparer l'image.")
  }

  return blob
}

function assertMinimumDimensions(width: number, height: number): void {
  if (width < MIN_SOURCE_DIMENSION || height < MIN_SOURCE_DIMENSION) {
    throw new Error('Image trop petite. Rapprochez-vous du tableau nutritionnel.')
  }
}

async function flattenBitmap(source: Blob, respectExif: boolean): Promise<Blob> {
  const bitmap = respectExif ? await loadOrientedBitmap(source) : await loadFlatBitmap(source)
  assertMinimumDimensions(bitmap.width, bitmap.height)
  return bitmapToJpeg(bitmap)
}

export async function normalizeLabelImageOrientation(source: Blob): Promise<Blob> {
  return flattenBitmap(source, true)
}

export async function normalizeLabelImageWithoutExif(source: Blob): Promise<Blob> {
  return flattenBitmap(source, false)
}

async function blobsDiffer(a: Blob, b: Blob): Promise<boolean> {
  if (a.size !== b.size) {
    return true
  }

  const [dimsA, dimsB] = await Promise.all([
    createImageBitmap(a).then((bitmap) => {
      const dimensions = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return dimensions
    }),
    createImageBitmap(b).then((bitmap) => {
      const dimensions = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return dimensions
    }),
  ])

  return dimsA.width !== dimsB.width || dimsA.height !== dimsB.height
}

export async function buildLabelOcrBaseImages(source: Blob): Promise<Blob[]> {
  const withExif = await normalizeLabelImageOrientation(source)
  const withoutExif = await normalizeLabelImageWithoutExif(source)

  if (await blobsDiffer(withExif, withoutExif)) {
    return [withExif, withoutExif]
  }

  return [withExif]
}

export async function preprocessLabelImageForOcr(source: Blob): Promise<Blob> {
  const bitmap = await loadFlatBitmap(source)
  assertMinimumDimensions(bitmap.width, bitmap.height)

  const scale = Math.max(1, TARGET_MIN_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    return source
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const gray = enhanceContrast(
      0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2],
    )
    data[index] = gray
    data[index + 1] = gray
    data[index + 2] = gray
  }

  context.putImageData(imageData, 0, 0)

  const processed = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  return processed ?? source
}
