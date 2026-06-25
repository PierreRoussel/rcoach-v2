import { describe, expect, it } from 'vitest'

import { resolveScheduleTitle } from '@/lib/schedule/resolve-schedule-title'

const templates = [
  { id: 'tpl-1', name: 'Fullbody A' },
  { id: 'tpl-2', name: 'Push Day' },
]

describe('resolveScheduleTitle', () => {
  it('keeps a custom title when provided', () => {
    expect(
      resolveScheduleTitle(
        { title: 'Ma séance perso', workoutTemplateId: 'tpl-1' },
        templates,
      ),
    ).toBe('Ma séance perso')
  })

  it('falls back to template name when title is empty', () => {
    expect(
      resolveScheduleTitle({ title: '', workoutTemplateId: 'tpl-1' }, templates),
    ).toBe('Fullbody A')
  })

  it('returns empty string when neither title nor template is set', () => {
    expect(
      resolveScheduleTitle({ title: '  ', workoutTemplateId: null }, templates),
    ).toBe('')
  })

  it('joins both template names for aba recurrence', () => {
    expect(
      resolveScheduleTitle(
        {
          title: '',
          workoutTemplateId: 'tpl-1',
          workoutTemplateIdB: 'tpl-2',
          recurrenceType: 'aba',
        },
        templates,
      ),
    ).toBe('Fullbody A / Push Day')
  })
})
