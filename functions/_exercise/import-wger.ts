import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildTemplateCoachingCues } from './coaching.ts'
import {
  insertPublicExercise,
  listExerciseCatalog,
  updateExerciseWgerId,
  type ExerciseCatalogEntry,
} from './hasura.ts'
import { coachingCuesFromWgerDescription } from './wger.ts'
import {
  iterateWgerExerciseInfos,
  type WgerCategoryKey,
  WGER_CATEGORY_IDS,
} from './wger.ts'
import {
  mapWgerExercise,
  normalizeCatalogName,
  type MappedWgerExercise,
} from './wger-map.ts'
import { resolveExerciseNameFr } from './exercise-translation-build.ts'

type ManualWgerMap = Record<string, number>

export type ImportWgerOptions = {
  dryRun?: boolean
  limit?: number
  category?: WgerCategoryKey
  linkExisting?: boolean
  enrich?: (exerciseId: string) => Promise<void>
}

export type ImportWgerResult = {
  linked: number
  linkSkippedWgerIdTaken: number
  inserted: number
  skippedExisting: number
  skippedDuplicateName: number
  skippedNoEnglish: number
  failed: number
}

export type LinkExistingResult = {
  linked: number
  skippedAlreadyLinked: number
  skippedWgerIdTaken: number
  skippedMissingExercise: number
}

export function planManualWgerLinks(
  manualMap: ManualWgerMap,
  catalog: ExerciseCatalogEntry[],
): Array<{ exerciseId: string; name: string; wgerId: number }> {
  const byName = new Map(catalog.map((entry) => [entry.name, entry]))
  const takenWgerIds = new Set<number>()

  for (const entry of catalog) {
    if (entry.wger_exercise_id != null) {
      takenWgerIds.add(entry.wger_exercise_id)
    }
  }

  const planned: Array<{ exerciseId: string; name: string; wgerId: number }> = []

  for (const [name, wgerId] of Object.entries(manualMap)) {
    const exercise = byName.get(name)
    if (!exercise || exercise.wger_exercise_id != null) {
      continue
    }
    if (takenWgerIds.has(wgerId)) {
      continue
    }

    planned.push({ exerciseId: exercise.id, name, wgerId })
    takenWgerIds.add(wgerId)
  }

  return planned
}

function loadManualWgerMap(): ManualWgerMap {
  try {
    const mapPath = resolve(process.cwd(), 'scripts/wger-exercise-map.json')
    const raw = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<string, unknown>
    const entries = Object.entries(raw).filter(([key]) => !key.startsWith('_'))
    return Object.fromEntries(
      entries.filter(([, value]) => typeof value === 'number'),
    ) as ManualWgerMap
  } catch {
    return {}
  }
}

function buildCoachingCues(
  mapped: MappedWgerExercise,
  descriptionFr: string,
  descriptionEn: string,
) {
  const wgerCues = coachingCuesFromWgerDescription(descriptionFr || descriptionEn)
  const template = buildTemplateCoachingCues({
    muscleGroup: mapped.muscle_group,
    equipment: mapped.equipment,
    trackingMode: mapped.tracking_mode,
  })

  return {
    summary: wgerCues.summary ?? template.summary,
    setup: wgerCues.setup ?? template.setup,
    execution: wgerCues.execution ?? template.execution,
    cues: template.cues,
    mistakes: template.mistakes,
  }
}

function buildCatalogIndexes(catalog: ExerciseCatalogEntry[]) {
  const byWgerId = new Map<number, ExerciseCatalogEntry>()
  const byNormalizedName = new Map<string, ExerciseCatalogEntry>()

  for (const entry of catalog) {
    if (entry.wger_exercise_id != null) {
      byWgerId.set(entry.wger_exercise_id, entry)
    }
    byNormalizedName.set(normalizeCatalogName(entry.name), entry)
  }

  return { byWgerId, byNormalizedName }
}

export async function linkExistingExercisesFromManualMap(options?: {
  dryRun?: boolean
}): Promise<LinkExistingResult> {
  const manualMap = loadManualWgerMap()
  const catalog = await listExerciseCatalog()
  const byName = new Map(catalog.map((entry) => [entry.name, entry]))
  const takenWgerIds = new Set<number>()

  for (const entry of catalog) {
    if (entry.wger_exercise_id != null) {
      takenWgerIds.add(entry.wger_exercise_id)
    }
  }

  const result: LinkExistingResult = {
    linked: 0,
    skippedAlreadyLinked: 0,
    skippedWgerIdTaken: 0,
    skippedMissingExercise: 0,
  }

  for (const [name, wgerId] of Object.entries(manualMap)) {
    const exercise = byName.get(name)
    if (!exercise) {
      result.skippedMissingExercise += 1
      continue
    }

    if (exercise.wger_exercise_id != null) {
      result.skippedAlreadyLinked += 1
      continue
    }

    if (takenWgerIds.has(wgerId)) {
      result.skippedWgerIdTaken += 1
      continue
    }

    if (options?.dryRun) {
      takenWgerIds.add(wgerId)
      result.linked += 1
      continue
    }

    await updateExerciseWgerId(exercise.id, wgerId)
    exercise.wger_exercise_id = wgerId
    takenWgerIds.add(wgerId)
    result.linked += 1
  }

  return result
}

export async function importWgerExercises(
  options: ImportWgerOptions = {},
): Promise<ImportWgerResult> {
  const result: ImportWgerResult = {
    linked: 0,
    linkSkippedWgerIdTaken: 0,
    inserted: 0,
    skippedExisting: 0,
    skippedDuplicateName: 0,
    skippedNoEnglish: 0,
    failed: 0,
  }

  if (options.linkExisting !== false) {
    const linkResult = await linkExistingExercisesFromManualMap({
      dryRun: options.dryRun,
    })
    result.linked = linkResult.linked
    result.linkSkippedWgerIdTaken = linkResult.skippedWgerIdTaken

    if (linkResult.skippedWgerIdTaken > 0) {
      console.log(
        `[import:wger] ${linkResult.skippedWgerIdTaken} liaison(s) ignorée(s) — wger id déjà attribué à un autre exercice`,
      )
    }
  }

  let catalog = await listExerciseCatalog()
  let indexes = buildCatalogIndexes(catalog)
  const pendingNames = new Set<string>()

  const categoryId =
    options.category != null ? WGER_CATEGORY_IDS[options.category] : undefined

  for await (const source of iterateWgerExerciseInfos({ categoryId })) {
    if (options.limit != null && result.inserted >= options.limit) {
      break
    }

    if (indexes.byWgerId.has(source.id)) {
      result.skippedExisting += 1
      continue
    }

    const mapped = mapWgerExercise(source)
    const normalizedName = normalizeCatalogName(mapped.name)

    if (indexes.byNormalizedName.has(normalizedName) || pendingNames.has(normalizedName)) {
      result.skippedDuplicateName += 1
      continue
    }

    const coaching_cues = buildCoachingCues(
      mapped,
      source.descriptionFr,
      source.descriptionEn,
    )

    if (options.dryRun) {
      console.log(
        `[import:wger] would insert #${source.id} → ${mapped.name} (${mapped.muscle_group}/${mapped.equipment})`,
      )
      pendingNames.add(normalizedName)
      result.inserted += 1
      continue
    }

    try {
      const name_fr = resolveExerciseNameFr({
        name: mapped.name,
        wgerNameFr: source.nameFr,
      })

      const exerciseId = await insertPublicExercise({
        ...mapped,
        name_fr,
        coaching_cues,
        content_status: 'partial',
        content_source: 'wger',
      })

      pendingNames.add(normalizedName)
      indexes.byWgerId.set(source.id, {
        id: exerciseId,
        name: mapped.name,
        wger_exercise_id: source.id,
      })
      indexes.byNormalizedName.set(normalizedName, {
        id: exerciseId,
        name: mapped.name,
        wger_exercise_id: source.id,
      })

      if (options.enrich) {
        await options.enrich(exerciseId)
      }

      console.log(`[import:wger] inserted #${source.id} → ${mapped.name}`)
      result.inserted += 1
    } catch (error) {
      result.failed += 1
      console.error(
        `[import:wger] failed #${source.id} (${mapped.name}): ${
          error instanceof Error ? error.message : error
        }`,
      )
    }
  }

  return result
}
