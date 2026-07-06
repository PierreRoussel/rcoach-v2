export type LabelImageRotation = 0 | 90 | 180 | 270

const ROTATIONS: LabelImageRotation[] = [0, 90, 180, 270]

export async function readImageDimensions(
  source: Blob,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(source)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

export function isLandscapeImage(dimensions: { width: number; height: number }): boolean {
  return dimensions.width > dimensions.height * 1.05
}

export function snapToRightAngle(degrees: number): LabelImageRotation {
  const normalized = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360
  return normalized as LabelImageRotation
}

/** Tesseract OSD: rotation horaire pour remettre le texte à l'endroit. */
export function osdOrientationToClockwiseRotation(orientationDegrees: number): LabelImageRotation {
  const snapped = snapToRightAngle(orientationDegrees)

  switch (snapped) {
    case 0:
      return 0
    case 90:
      return 270
    case 180:
      return 180
    case 270:
      return 90
    default:
      return 0
  }
}

export function buildLabelOcrRotationPlan(
  osdRotations: LabelImageRotation[],
  landscape: boolean,
): LabelImageRotation[] {
  const ordered: LabelImageRotation[] = []

  const push = (rotation: LabelImageRotation) => {
    if (!ordered.includes(rotation)) {
      ordered.push(rotation)
    }
  }

  for (const rotation of osdRotations) {
    push(rotation)
    if (rotation === 90) {
      push(270)
    } else if (rotation === 270) {
      push(90)
    }
  }

  push(0)

  if (landscape) {
    for (const rotation of [90, 270, 180] as const) {
      push(rotation)
    }
  } else {
    for (const rotation of [90, 180, 270] as const) {
      push(rotation)
    }
  }

  for (const rotation of ROTATIONS) {
    push(rotation)
  }

  return ordered
}

export async function rotateImageBlob(
  source: Blob,
  degrees: Exclude<LabelImageRotation, 0>,
): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const radians = (degrees * Math.PI) / 180
  const swapDimensions = degrees === 90 || degrees === 270
  const canvas = document.createElement('canvas')
  canvas.width = swapDimensions ? bitmap.height : bitmap.width
  canvas.height = swapDimensions ? bitmap.width : bitmap.height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error("Impossible de pivoter l'image.")
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate(radians)
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) {
    throw new Error("Impossible de pivoter l'image.")
  }

  return blob
}

export async function applyLabelImageRotation(
  source: Blob,
  rotation: LabelImageRotation,
): Promise<Blob> {
  if (rotation === 0) {
    return source
  }

  return rotateImageBlob(source, rotation)
}
