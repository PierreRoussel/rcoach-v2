import { describe, expect, it } from 'vitest'

import {
  buildTemplateCoachingCues,
  hasCoachingContent,
  normalizeExerciseSearchName,
  parseExerciseCoachingCues,
  resolveExerciseCoaching,
} from '@/lib/workout/exercise-coaching'

describe('exercise-coaching', () => {
  it('parses structured coaching cues', () => {
    const parsed = parseExerciseCoachingCues({
      summary: 'Mouvement de base.',
      setup: 'Pieds largeur épaules.',
      execution: 'Descends contrôlé.',
      cues: ['Gainage serré'],
      mistakes: ['Dos rond'],
    })

    expect(parsed).toEqual({
      summary: 'Mouvement de base.',
      setup: 'Pieds largeur épaules.',
      execution: 'Descends contrôlé.',
      cues: ['Gainage serré'],
      mistakes: ['Dos rond'],
    })
  })

  it('returns null for invalid coaching payloads', () => {
    expect(parseExerciseCoachingCues(null)).toBeNull()
    expect(parseExerciseCoachingCues([])).toBeNull()
    expect(parseExerciseCoachingCues({ cues: [1, 2] })).toBeNull()
  })

  it('builds template coaching from muscle and equipment', () => {
    const template = buildTemplateCoachingCues({
      muscleGroup: 'legs',
      equipment: 'barbell',
      trackingMode: 'weighted',
    })

    expect(template.summary).toContain('jambes')
    expect(template.summary).toContain('barre')
    expect(template.cues?.length).toBeGreaterThan(0)
  })

  it('prefers stored cues over template fallback', () => {
    const fallback = buildTemplateCoachingCues({
      muscleGroup: 'chest',
      equipment: 'dumbbell',
    })

    const resolved = resolveExerciseCoaching(
      { summary: 'Consigne personnalisée.' },
      null,
      fallback,
    )

    expect(resolved.summary).toBe('Consigne personnalisée.')
  })

  it('uses description_fr when cues are absent', () => {
    const fallback = buildTemplateCoachingCues({
      muscleGroup: 'back',
      equipment: 'cable',
    })

    const resolved = resolveExerciseCoaching(null, 'Texte libre.', fallback)

    expect(resolved.summary).toBe('Texte libre.')
    expect(resolved.setup).toBe(fallback.setup)
  })

  it('detects coaching content presence', () => {
    expect(hasCoachingContent(null, 'Description')).toBe(true)
    expect(hasCoachingContent({ cues: ['Repère'] }, null)).toBe(true)
    expect(hasCoachingContent({}, null)).toBe(false)
  })

  it('normalizes exercise names for search', () => {
    expect(normalizeExerciseSearchName('Squat (Barbell)')).toBe('squat barbell')
  })
})
