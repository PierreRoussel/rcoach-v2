const WGER_BASE = 'https://wger.de/api/v2'
const WGER_LANGUAGE_EN = 2
const WGER_LANGUAGE_FR = 12

export type WgerVideo = {
  id: number
  video: string
  size?: number
  duration?: string
  width?: number
  height?: number
  codec?: string
}

export type WgerExerciseInfo = {
  id: number
  uuid: string
  name: string
  description: string
  category: { id: number; name: string }
  muscles: Array<{ id: number; name: string }>
  equipment: Array<{ id: number; name: string }>
  videos: WgerVideo[]
  images: Array<{ image: string }>
}

export type WgerSearchHit = {
  value: string
  data: {
    id: number
    name: string
    category: string
    image: string | null
    base_id?: number
  }
}

export function normalizeExerciseSearchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenOverlapScore(a: string, b: string): number {
  const tokensA = new Set(normalizeExerciseSearchName(a).split(' ').filter(Boolean))
  const tokensB = new Set(normalizeExerciseSearchName(b).split(' ').filter(Boolean))
  if (!tokensA.size || !tokensB.size) {
    return 0
  }

  let overlap = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap += 1
    }
  }

  return overlap / Math.max(tokensA.size, tokensB.size)
}

async function wgerFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${WGER_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`wger request failed (${response.status}): ${path}`)
  }

  return response.json() as Promise<T>
}

export async function searchWgerExercises(term: string): Promise<WgerSearchHit[]> {
  const encoded = encodeURIComponent(term.trim())
  const payload = await wgerFetch<{ suggestions: WgerSearchHit[] }>(
    `/exercise/search/?term=${encoded}&language=${WGER_LANGUAGE_EN}`,
  )

  return payload.suggestions ?? []
}

export async function getWgerExerciseInfo(
  exerciseBaseId: number,
  language = WGER_LANGUAGE_FR,
): Promise<WgerExerciseInfo | null> {
  const payload = await wgerFetch<{ results: WgerExerciseInfo[] }>(
    `/exerciseinfo/?exercise=${exerciseBaseId}&language=${language}&limit=1`,
  )

  return payload.results[0] ?? null
}

export async function findBestWgerMatch(
  exerciseName: string,
  manualWgerId?: number,
): Promise<{ info: WgerExerciseInfo; score: number } | null> {
  if (manualWgerId) {
    const info =
      (await getWgerExerciseInfo(manualWgerId, WGER_LANGUAGE_FR)) ??
      (await getWgerExerciseInfo(manualWgerId, WGER_LANGUAGE_EN))
    if (info) {
      return { info, score: 1 }
    }
  }

  const hits = await searchWgerExercises(exerciseName)
  if (!hits.length) {
    return null
  }

  let best: { info: WgerExerciseInfo; score: number } | null = null

  for (const hit of hits.slice(0, 5)) {
    const baseId = hit.data.base_id ?? hit.data.id
    const info =
      (await getWgerExerciseInfo(baseId, WGER_LANGUAGE_FR)) ??
      (await getWgerExerciseInfo(baseId, WGER_LANGUAGE_EN))

    if (!info) {
      continue
    }

    const score = Math.max(
      tokenOverlapScore(exerciseName, info.name),
      tokenOverlapScore(exerciseName, hit.value),
    )

    if (!best || score > best.score) {
      best = { info, score }
    }
  }

  if (!best || best.score < 0.35) {
    return null
  }

  return best
}

export function pickWgerVideo(info: WgerExerciseInfo): WgerVideo | null {
  if (!info.videos?.length) {
    return null
  }

  return [...info.videos].sort((left, right) => (right.size ?? 0) - (left.size ?? 0))[0]
}

export function coachingCuesFromWgerDescription(description: string) {
  const trimmed = description.trim()
  if (!trimmed) {
    return {}
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (paragraphs.length === 1) {
    return { summary: paragraphs[0] }
  }

  return {
    summary: paragraphs[0],
    setup: paragraphs[1],
    execution: paragraphs.slice(2).join(' '),
  }
}

export async function downloadWgerVideo(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download wger video (${response.status})`)
  }

  return response.arrayBuffer()
}
