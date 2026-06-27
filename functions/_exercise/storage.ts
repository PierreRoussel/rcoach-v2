import { resolveNhostEndpoints } from './hasura.ts'

const EXERCISE_DEMO_BUCKET = 'exercise-demos'

type UploadedFile = {
  id: string
}

type UploadResponse = {
  processedFiles?: UploadedFile[]
}

function extensionFromMime(mimeType: string): string {
  if (mimeType.includes('webm')) {
    return 'webm'
  }
  if (mimeType.includes('mp4')) {
    return 'mp4'
  }
  if (mimeType.includes('webp')) {
    return 'webp'
  }
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return 'jpg'
  }
  return 'bin'
}

export async function uploadExerciseDemoFile(input: {
  exerciseId: string
  kind: 'demo' | 'poster'
  buffer: ArrayBuffer
  mimeType: string
}): Promise<string> {
  const { storageUrl, adminSecret } = resolveNhostEndpoints()
  const extension = extensionFromMime(input.mimeType)
  const fileName = `${input.exerciseId}/${input.kind}.${extension}`

  const formData = new FormData()
  formData.append('bucket-id', EXERCISE_DEMO_BUCKET)
  formData.append(
    'file[]',
    new Blob([input.buffer], { type: input.mimeType }),
    fileName,
  )
  formData.append('metadata[]', JSON.stringify({ name: fileName }))

  const response = await fetch(`${storageUrl}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminSecret}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Storage upload failed (${response.status}): ${body}`)
  }

  const payload = (await response.json()) as UploadResponse
  const fileId = payload.processedFiles?.[0]?.id
  if (!fileId) {
    throw new Error('Storage upload returned no file id.')
  }

  return fileId
}

export async function uploadWgerVideo(
  exerciseId: string,
  videoBuffer: ArrayBuffer,
  contentType = 'video/mp4',
): Promise<string> {
  return uploadExerciseDemoFile({
    exerciseId,
    kind: 'demo',
    buffer: videoBuffer,
    mimeType: contentType,
  })
}

export async function uploadPosterFromWgerImage(
  exerciseId: string,
  imageUrl: string,
): Promise<string | null> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    return null
  }

  const buffer = await response.arrayBuffer()
  const mimeType = response.headers.get('content-type') ?? 'image/jpeg'

  return uploadExerciseDemoFile({
    exerciseId,
    kind: 'poster',
    buffer,
    mimeType,
  })
}
