import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildTemplateCoachingCues } from './coaching.ts'
import {
  findPublicCatalogMatch,
  getExerciseById,
  updateExerciseContent,
  type ExerciseRow,
} from './hasura.ts'
import { uploadPosterFromWgerImage, uploadWgerVideo } from './storage.ts'
import {
  coachingCuesFromWgerDescription,
  downloadWgerVideo,
  findBestWgerMatch,
  pickWgerVideo,
} from './wger.ts'

type ManualWgerMap = Record<string, number>

let manualWgerMap: ManualWgerMap | null = null

async function loadManualWgerMap(): Promise<ManualWgerMap> {
  if (manualWgerMap) {
    return manualWgerMap
  }

  try {
    const mapPath = resolve(process.cwd(), 'scripts/wger-exercise-map.json')
    manualWgerMap = JSON.parse(readFileSync(mapPath, 'utf8')) as ManualWgerMap
  } catch {
    manualWgerMap = {}
  }

  return manualWgerMap
}

function copyCatalogContent(source: ExerciseRow) {
  return {
    description_fr: source.description_fr,
    description_en: source.description_en,
    coaching_cues: source.coaching_cues,
    demo_file_id: source.demo_file_id,
    demo_poster_file_id: source.demo_poster_file_id,
    content_status: source.demo_file_id ? 'ready' : source.content_status,
    content_source: source.content_source ?? 'catalog',
  }
}

export async function enrichExerciseContent(exerciseId: string): Promise<{
  content_status: string
  content_source: string | null
}> {
  const exercise = await getExerciseById(exerciseId)
  if (!exercise) {
    throw new Error('Exercise not found.')
  }

  if (exercise.content_status === 'ready' && exercise.demo_file_id) {
    return {
      content_status: exercise.content_status,
      content_source: exercise.content_source ?? null,
    }
  }

  const catalogMatch = await findPublicCatalogMatch(exercise.name)
  if (
    catalogMatch &&
    catalogMatch.id !== exercise.id &&
    (catalogMatch.demo_file_id || catalogMatch.coaching_cues || catalogMatch.description_fr)
  ) {
    const patch = copyCatalogContent(catalogMatch)
    await updateExerciseContent(exerciseId, patch)
    return {
      content_status: patch.content_status ?? 'partial',
      content_source: patch.content_source ?? null,
    }
  }

  const manualMap = await loadManualWgerMap()
  const manualWgerId = manualMap[exercise.name]
  const wgerMatch = await findBestWgerMatch(exercise.name, manualWgerId)

  if (!wgerMatch) {
    const template = buildTemplateCoachingCues({
      muscleGroup: exercise.muscle_group,
      equipment: exercise.equipment,
      trackingMode: exercise.tracking_mode,
    })

    await updateExerciseContent(exerciseId, {
      description_fr: template.summary ?? null,
      coaching_cues: template,
      content_status: 'partial',
      content_source: 'manual',
    })

    return { content_status: 'partial', content_source: 'manual' }
  }

  const { info } = wgerMatch
  const wgerCues = coachingCuesFromWgerDescription(info.description ?? '')
  const template = buildTemplateCoachingCues({
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    trackingMode: exercise.tracking_mode,
  })

  const coaching_cues = {
    summary: wgerCues.summary ?? template.summary,
    setup: wgerCues.setup ?? template.setup,
    execution: wgerCues.execution ?? template.execution,
    cues: template.cues,
    mistakes: template.mistakes,
  }

  const video = pickWgerVideo(info)
  let demo_file_id: string | null = null
  let demo_poster_file_id: string | null = null
  let content_status: 'ready' | 'partial' = 'partial'

  if (video?.video) {
    try {
      const buffer = await downloadWgerVideo(video.video)
      demo_file_id = await uploadWgerVideo(exerciseId, buffer, 'video/mp4')
      content_status = 'ready'
    } catch {
      content_status = 'partial'
    }
  }

  const posterImage = info.images?.[0]?.image
  if (posterImage) {
    try {
      demo_poster_file_id = await uploadPosterFromWgerImage(exerciseId, posterImage)
    } catch {
      demo_poster_file_id = null
    }
  }

  await updateExerciseContent(exerciseId, {
    description_fr: coaching_cues.summary ?? null,
    description_en: info.description || null,
    coaching_cues,
    demo_file_id,
    demo_poster_file_id,
    content_status,
    content_source: 'wger',
  })

  return { content_status, content_source: 'wger' }
}
