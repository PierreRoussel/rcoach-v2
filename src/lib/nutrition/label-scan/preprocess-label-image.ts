const TARGET_MIN_WIDTH = 1_600

function enhanceContrast(gray: number): number {
  const normalized = gray / 255
  const contrasted = (normalized - 0.5) * 1.35 + 0.5
  return Math.max(0, Math.min(255, Math.round(contrasted * 255)))
}

export async function preprocessLabelImageForOcr(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const scale = Math.max(1, TARGET_MIN_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return source
  }

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
