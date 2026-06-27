import { resolveExerciseNameFr } from './exercise-translation-build.ts'
import {
  listExercisesForNameFrBackfill,
  updateExerciseNameFr,
} from './hasura.ts'
import { parseWgerImportInfo } from './wger.ts'

export type BackfillNameFrOptions = {
  dryRun?: boolean
  force?: boolean
  onProgress?: (message: string) => void
}

export type BackfillNameFrResult = {
  updated: number
  skipped: number
  skippedExisting: number
  failed: number
}

async function fetchWgerFrenchName(wgerExerciseId: number): Promise<string | null> {
  const response = await fetch(`https://wger.de/api/v2/exerciseinfo/${wgerExerciseId}/`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`wger ${wgerExerciseId} (${response.status})`)
  }

  const parsed = parseWgerImportInfo(await response.json())
  return parsed?.nameFr ?? null
}

export async function backfillExerciseNameFr(
  options: BackfillNameFrOptions = {},
): Promise<BackfillNameFrResult> {
  const exercises = await listExercisesForNameFrBackfill()
  const wgerCache = new Map<number, string | null>()

  const result: BackfillNameFrResult = {
    updated: 0,
    skipped: 0,
    skippedExisting: 0,
    failed: 0,
  }

  for (const exercise of exercises) {
    if (exercise.name_fr != null && !options.force) {
      result.skippedExisting += 1
      continue
    }

    let wgerNameFr: string | null = null
    if (exercise.wger_exercise_id != null) {
      if (wgerCache.has(exercise.wger_exercise_id)) {
        wgerNameFr = wgerCache.get(exercise.wger_exercise_id) ?? null
      } else {
        try {
          wgerNameFr = await fetchWgerFrenchName(exercise.wger_exercise_id)
          wgerCache.set(exercise.wger_exercise_id, wgerNameFr)
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 120))
        } catch (error) {
          result.failed += 1
          options.onProgress?.(
            `[backfill:name_fr] ${exercise.name}: ${
              error instanceof Error ? error.message : error
            }`,
          )
          continue
        }
      }
    }

    const nameFr = resolveExerciseNameFr({
      name: exercise.name,
      wgerNameFr,
    })

    if (exercise.name_fr === nameFr) {
      result.skipped += 1
      continue
    }

    if (options.dryRun) {
      options.onProgress?.(
        `[backfill:name_fr] would set ${exercise.name} → ${nameFr ?? '(null, anglicisme)'}`,
      )
      result.updated += 1
      continue
    }

    try {
      await updateExerciseNameFr(exercise.id, nameFr)
      options.onProgress?.(
        `[backfill:name_fr] ${exercise.name} → ${nameFr ?? '(null)'}`,
      )
      result.updated += 1
    } catch (error) {
      result.failed += 1
      options.onProgress?.(
        `[backfill:name_fr] failed ${exercise.name}: ${
          error instanceof Error ? error.message : error
        }`,
      )
    }
  }

  return result
}
