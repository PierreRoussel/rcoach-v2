export type LabelOcrProgress = {
  progress: number
  status: string
}

export async function recognizeLabelTextFromImage(
  image: Blob,
  onProgress?: (state: LabelOcrProgress) => void,
): Promise<string> {
  const { createWorker, PSM } = await import('tesseract.js')
  const { preprocessLabelImageForOcr } = await import(
    '@/lib/nutrition/label-scan/preprocess-label-image'
  )

  const processedImage = await preprocessLabelImageForOcr(image)

  const worker = await createWorker('fra', undefined, {
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
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })

    const {
      data: { text },
    } = await worker.recognize(processedImage)
    return text
  } finally {
    await worker.terminate()
  }
}
