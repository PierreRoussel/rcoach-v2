export const MIN_OCR_IMAGE_DIMENSION = 64
export const TARGET_OCR_MIN_WIDTH = 1_600

export function isOcrReadyDimensions(width: number, height: number): boolean {
  return (
    width >= MIN_OCR_IMAGE_DIMENSION &&
    height >= MIN_OCR_IMAGE_DIMENSION &&
    width >= TARGET_OCR_MIN_WIDTH / 2 &&
    height >= 120
  )
}
