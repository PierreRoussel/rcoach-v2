import type { NhostClient } from '@nhost/nhost-js'
import { generateServiceUrl } from '@nhost/nhost-js'

const AVATAR_BUCKET_ID = 'avatars'
const AVATAR_MAX_SIZE = 256

async function resizeImageToWebp(file: File, maxSize = AVATAR_MAX_SIZE): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Impossible de préparer l’image.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Impossible de compresser l’image.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      0.85,
    )
  })
}

export function getAvatarPublicUrl(nhost: NhostClient, fileId: string): string {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
  const region = import.meta.env.VITE_NHOST_REGION
  const base =
    nhost.storage.baseURL ||
    generateServiceUrl('storage', subdomain, region)
  return `${base}/files/${fileId}`
}

export async function uploadAvatar(
  nhost: NhostClient,
  userId: string,
  file: File,
): Promise<string> {
  const blob = await resizeImageToWebp(file)
  const response = await nhost.storage.uploadFiles({
    'bucket-id': AVATAR_BUCKET_ID,
    'file[]': [blob],
    'metadata[]': [{ name: `${userId}/avatar.webp` }],
  })

  const uploaded = response.body.processedFiles[0]
  if (!uploaded?.id) {
    throw new Error('Échec du téléversement de l’avatar.')
  }

  return getAvatarPublicUrl(nhost, uploaded.id)
}
