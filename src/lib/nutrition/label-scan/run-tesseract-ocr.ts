import { detectLabelImageRotation } from '@/lib/nutrition/label-scan/detect-label-orientation'
import {
  applyLabelImageRotation,
  buildLabelOcrRotationPlan,
  isLandscapeImage,
  readImageDimensions,
  type LabelImageRotation,
} from '@/lib/nutrition/label-scan/label-image-rotation'
import { scoreOcrNutritionParse } from '@/lib/nutrition/label-scan/score-ocr-nutrition-text'

export type LabelOcrProgress = {
  progress: number
  status: string
}

const MIN_USEFUL_NUTRITION_SCORE = 18

export async function recognizeLabelTextFromImage(
  image: Blob,
  onProgress?: (state: LabelOcrProgress) => void,
): Promise<string> {
  const { createWorker, PSM } = await import('tesseract.js')
  const { buildLabelOcrBaseImages, preprocessLabelImageForOcr } = await import(
    '@/lib/nutrition/label-scan/preprocess-label-image'
  )

  const baseImages = await buildLabelOcrBaseImages(image)
  const osdRotations: LabelImageRotation[] = []

  for (const baseImage of baseImages) {
    const detection = await detectLabelImageRotation(baseImage)
    if (detection) {
      osdRotations.push(detection.rotation)
    }
  }

  const landscape = await Promise.all(baseImages.map((baseImage) => readImageDimensions(baseImage))).then(
    (dimensions) => dimensions.some(isLandscapeImage),
  )

  const rotationPlan = buildLabelOcrRotationPlan(osdRotations, landscape)

  const worker = await createWorker('fra', undefined, {
    errorHandler: () => {},
    logger: (message) => {
      if (!onProgress) {
        return
      }

      onProgress({
        progress: typeof message.progress === 'number' ? message.progress : 0,
        status: message.status ?? '',
      })
    },
  })

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })

    let bestText = ''
    let bestScore = -1
    let bestCandidate: Blob | null = null

    const recognizeCandidate = async (candidate: Blob, pagesegMode: number) => {
      await worker.setParameters({
        tessedit_pageseg_mode: pagesegMode,
      })

      const {
        data: { text },
      } = await worker.recognize(candidate, {}, { text: true })

      const score = scoreOcrNutritionParse(text)
      if (score > bestScore) {
        bestScore = score
        bestText = text
        bestCandidate = candidate
      }
    }

    for (const baseImage of baseImages) {
      for (const rotation of rotationPlan) {
        const orientedBase = await applyLabelImageRotation(baseImage, rotation)
        const processedImage = await preprocessLabelImageForOcr(orientedBase)

        await recognizeCandidate(processedImage, PSM.AUTO)

        if (bestScore >= MIN_USEFUL_NUTRITION_SCORE) {
          return bestText
        }
      }
    }

    if (bestCandidate && bestScore < MIN_USEFUL_NUTRITION_SCORE) {
      await recognizeCandidate(bestCandidate, PSM.SINGLE_BLOCK)
    }

    return bestText
  } finally {
    await worker.terminate()
  }
}
