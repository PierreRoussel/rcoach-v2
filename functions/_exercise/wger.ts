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

type WgerTranslation = {
  id: number
  name: string
  description?: string | null
  description_source?: string | null
  language: number
}

type WgerExerciseInfoRaw = {
  id: number
  uuid: string
  category: { id: number; name: string }
  muscles: Array<{ id: number; name: string }>
  equipment: Array<{ id: number; name: string }>
  videos?: WgerVideo[]
  images?: Array<{ image: string }>
  translations?: WgerTranslation[]
}

export function normalizeExerciseSearchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickTranslation(
  translations: WgerTranslation[] | undefined,
  preferFrench = true,
): WgerTranslation | null {
  if (!translations?.length) {
    return null
  }

  if (preferFrench) {
    const french = translations.find((entry) => entry.language === WGER_LANGUAGE_FR)
    if (french) {
      return french
    }
  }

  const english = translations.find((entry) => entry.language === WGER_LANGUAGE_EN)
  return english ?? translations[0] ?? null
}

function translationDescription(translation: WgerTranslation | null): string {
  if (!translation) {
    return ''
  }

  const raw =
    translation.description_source ??
    translation.description ??
    ''

  return stripHtml(raw)
}

function normalizeExerciseInfo(raw: WgerExerciseInfoRaw): WgerExerciseInfo {
  const french = pickTranslation(raw.translations, true)
  const english = pickTranslation(raw.translations, false)

  return {
    id: raw.id,
    uuid: raw.uuid,
    name: french?.name ?? english?.name ?? 'Exercise',
    description: translationDescription(french) || translationDescription(english),
    category: raw.category,
    muscles: raw.muscles ?? [],
    equipment: raw.equipment ?? [],
    videos: raw.videos ?? [],
    images: raw.images ?? [],
  }
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

function buildSearchTerms(exerciseName: string): string[] {
  const normalized = normalizeExerciseSearchName(exerciseName)
  const tokens = normalized.split(' ').filter(Boolean)
  const terms = new Set<string>()

  if (exerciseName.trim()) {
    terms.add(exerciseName.trim())
  }
  if (normalized) {
    terms.add(normalized)
  }
  if (tokens.length >= 2) {
    terms.add(tokens.join(' '))
    terms.add(`${tokens[1]} ${tokens[0]}`)
  }
  if (tokens.length >= 1) {
    terms.add(tokens[0])
  }

  return [...terms]
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

async function wgerFetchOptional<T>(path: string): Promise<T | null> {
  try {
    return await wgerFetch<T>(path)
  } catch {
    return null
  }
}

export async function getWgerExerciseInfoById(
  exerciseInfoId: number,
): Promise<WgerExerciseInfo | null> {
  const raw = await wgerFetchOptional<WgerExerciseInfoRaw>(`/exerciseinfo/${exerciseInfoId}/`)
  return raw ? normalizeExerciseInfo(raw) : null
}

export async function searchWgerExercises(term: string): Promise<WgerExerciseInfo[]> {
  const encoded = encodeURIComponent(term.trim())
  const payload = await wgerFetchOptional<{ results: WgerExerciseInfoRaw[] }>(
    `/exerciseinfo/?name__search=${encoded}&language__code=en&limit=12`,
  )

  return (payload?.results ?? []).map(normalizeExerciseInfo)
}

async function searchWgerExercisesWithFallbacks(
  exerciseName: string,
): Promise<WgerExerciseInfo[]> {
  const seen = new Set<number>()
  const results: WgerExerciseInfo[] = []

  for (const term of buildSearchTerms(exerciseName)) {
    const hits = await searchWgerExercises(term)
    for (const hit of hits) {
      if (seen.has(hit.id)) {
        continue
      }
      seen.add(hit.id)
      results.push(hit)
    }
  }

  return results
}

export async function findBestWgerMatch(
  exerciseName: string,
  manualExerciseInfoId?: number,
): Promise<{ info: WgerExerciseInfo; score: number } | null> {
  if (manualExerciseInfoId) {
    const info = await getWgerExerciseInfoById(manualExerciseInfoId)
    if (info) {
      return { info, score: 1 }
    }
  }

  const hits = await searchWgerExercisesWithFallbacks(exerciseName)
  if (!hits.length) {
    return null
  }

  let best: { info: WgerExerciseInfo; score: number } | null = null

  for (const info of hits.slice(0, 12)) {
    const score = tokenOverlapScore(exerciseName, info.name)
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

  return [...info.videos].sort((left, right) => {
    const leftSize = left.size ?? Number.MAX_SAFE_INTEGER
    const rightSize = right.size ?? Number.MAX_SAFE_INTEGER
    return leftSize - rightSize
  })[0]
}

export function coachingCuesFromWgerDescription(description: string | null | undefined) {
  const trimmed = stripHtml(description ?? '')
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
