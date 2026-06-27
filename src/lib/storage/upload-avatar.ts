import type { NhostClient } from '@nhost/nhost-js'
import { generateServiceUrl } from '@nhost/nhost-js'

const AVATAR_BUCKET_ID = 'avatars'
const AVATAR_MAX_SIZE = 256
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getStorageBaseUrl(nhost: NhostClient): string {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
  const region = import.meta.env.VITE_NHOST_REGION

  return (
    nhost.storage.baseURL || generateServiceUrl('storage', subdomain, region)
  )
}

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
  return `${getStorageBaseUrl(nhost)}/files/${fileId}`
}

export function parseStoredAvatarFileId(
  avatarUrl: string | null | undefined,
  nhost: NhostClient,
): string | null {
  if (!avatarUrl) {
    return null
  }

  const prefix = `${getStorageBaseUrl(nhost)}/files/`
  if (!avatarUrl.startsWith(prefix)) {
    return null
  }

  const fileId = avatarUrl.slice(prefix.length).split('?')[0]?.split('#')[0]
  if (!fileId || !UUID_PATTERN.test(fileId)) {
    return null
  }

  return fileId
}

export async function deleteStoredAvatarFile(
  nhost: NhostClient,
  fileId: string,
): Promise<void> {
  const response = await nhost.storage.deleteFile(fileId)

  if (response.status >= 300) {
    throw new Error('Impossible de supprimer l’ancienne photo de profil.')
  }
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

export async function replaceStoredAvatar(
  nhost: NhostClient,
  userId: string,
  file: File,
  previousAvatarUrl: string | null,
  saveAvatarUrl: (nextUrl: string) => Promise<void>,
): Promise<string> {
  const previousFileId = parseStoredAvatarFileId(previousAvatarUrl, nhost)
  const nextUrl = await uploadAvatar(nhost, userId, file)
  const nextFileId = parseStoredAvatarFileId(nextUrl, nhost)

  try {
    await saveAvatarUrl(nextUrl)
  } catch (error) {
    if (nextFileId) {
      try {
        await deleteStoredAvatarFile(nhost, nextFileId)
      } catch {
        // Best effort rollback if profile update fails.
      }
    }

    throw error
  }

  if (previousFileId && previousFileId !== nextFileId) {
    try {
      await deleteStoredAvatarFile(nhost, previousFileId)
    } catch {
      // Profile already points to the new avatar; keep going.
    }
  }

  return nextUrl
}

export async function removeStoredAvatar(
  nhost: NhostClient,
  previousAvatarUrl: string | null,
  clearAvatarUrl: () => Promise<void>,
): Promise<void> {
  const previousFileId = parseStoredAvatarFileId(previousAvatarUrl, nhost)

  await clearAvatarUrl()

  if (!previousFileId) {
    return
  }

  try {
    await deleteStoredAvatarFile(nhost, previousFileId)
  } catch {
    // Profile no longer references the old avatar.
  }
}
