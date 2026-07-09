import { describe, expect, it } from 'vitest'

import {
  countTemplateUsageFromWorkouts,
  rankTemplatesByUsage,
  resolveFrozenTemplateIds,
} from '@/lib/subscription/template-access'

describe('template-access', () => {
  it('ranks templates by usage with updated_at tie-break', () => {
    const usage = countTemplateUsageFromWorkouts([
      { workout_template_id: 'a' },
      { workout_template_id: 'a' },
      { workout_template_id: 'b' },
    ])

    const ranked = rankTemplatesByUsage(
      [
        { id: 'a', updated_at: '2026-01-01T00:00:00.000Z' },
        { id: 'b', updated_at: '2026-02-01T00:00:00.000Z' },
        { id: 'c', updated_at: '2026-03-01T00:00:00.000Z' },
      ],
      usage,
    )

    expect(ranked.map((entry) => entry.id)).toEqual(['a', 'b', 'c'])
  })

  it('freezes templates beyond the top six for non-premium users', () => {
    const ranked = Array.from({ length: 8 }, (_, index) => ({
      id: `t${index}`,
      usageCount: 8 - index,
      updatedAt: `2026-01-0${index + 1}T00:00:00.000Z`,
    }))

    const frozen = resolveFrozenTemplateIds(ranked, false)
    expect(frozen.size).toBe(2)
    expect(frozen.has('t6')).toBe(true)
    expect(frozen.has('t7')).toBe(true)
  })
})
