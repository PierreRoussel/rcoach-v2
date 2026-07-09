import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { toBlob } from 'html-to-image'

export async function exportShareCardElement(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: false,
  })

  if (!blob) {
    throw new Error("Impossible de générer l'image de partage.")
  }

  return blob
}

export async function downloadShareImage(blob: Blob, filename = 'rcoach-seance.png') {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function shareWorkoutImage(
  blob: Blob,
  options: { title: string; text?: string; url?: string },
) {
  const file = new File([blob], 'rcoach-seance.png', { type: 'image/png' })

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
        url: options.url,
      }

      if (!navigator.canShare || navigator.canShare({ ...shareData, files: [file] })) {
        await navigator.share({ ...shareData, files: [file] })
        return
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
    }
  }

  if (Capacitor.isNativePlatform()) {
    await downloadShareImage(blob)
    await Share.share({
      title: options.title,
      text: options.text ?? 'Ma séance RCoach',
      url: options.url,
      dialogTitle: 'Partager ma séance',
    })
    return
  }

  await downloadShareImage(blob)
}
