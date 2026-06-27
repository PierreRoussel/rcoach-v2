import { describe, expect, it } from 'vitest'

import {
  groupTemplatesForCatalog,
  shouldUseTemplateCatalogAccordions,
} from '@/lib/workout/group-templates-catalog'
import type { ScheduledSessionRecord, WorkoutTemplate } from '@/lib/graphql/operations'

function template(id: string, name: string, folder_name: string | null = null): WorkoutTemplate {
  return {
    id,
    name,
    folder_name,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    default_rest_seconds: 90,
    workout_template_exercises: [],
  }
}

function schedule(
  partial: Partial<ScheduledSessionRecord> & Pick<ScheduledSessionRecord, 'id' | 'title'>,
): ScheduledSessionRecord {
  return {
    workout_template_id: null,
    workout_template_id_b: null,
    recurrence_type: 'weekly',
    weekdays: [1],
    scheduled_date: null,
    time_local: null,
    start_date: '2026-01-01',
    end_date: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('groupTemplatesForCatalog', () => {
  it('groups templates by active schedule title', () => {
    const groups = groupTemplatesForCatalog({
      templates: [template('t1', 'Push'), template('t2', 'Pull')],
      scheduledSessions: [
        schedule({
          id: 's1',
          title: 'Semaine A',
          workout_template_id: 't1',
        }),
      ],
    })

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      kind: 'schedule',
      title: 'Semaine A',
      templates: [{ id: 't1' }],
    })
    expect(groups[1]).toMatchObject({
      kind: 'other',
      templates: [{ id: 't2' }],
    })
  })

  it('includes both templates for aba schedules', () => {
    const groups = groupTemplatesForCatalog({
      templates: [template('t1', 'Push'), template('t2', 'Pull')],
      scheduledSessions: [
        schedule({
          id: 's1',
          title: 'Alternance A/B',
          workout_template_id: 't1',
          workout_template_id_b: 't2',
          recurrence_type: 'aba',
        }),
      ],
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.templates.map((item) => item.id)).toEqual(['t1', 't2'])
  })

  it('groups unscheduled templates by folder name', () => {
    const groups = groupTemplatesForCatalog({
      templates: [
        template('t1', 'Push', 'Force'),
        template('t2', 'Cardio', 'Cardio'),
        template('t3', 'Mobilité'),
      ],
      scheduledSessions: [],
    })

    expect(groups.map((group) => group.title)).toEqual(['Cardio', 'Force', 'Autres'])
    expect(groups[0]?.kind).toBe('folder')
    expect(groups[0]?.templates.map((item) => item.id)).toEqual(['t2'])
    expect(groups[1]?.templates.map((item) => item.id)).toEqual(['t1'])
    expect(groups[2]?.templates.map((item) => item.id)).toEqual(['t3'])
  })

  it('prefers schedule grouping over folders', () => {
    const groups = groupTemplatesForCatalog({
      templates: [template('t1', 'Push', 'Force')],
      scheduledSessions: [
        schedule({
          id: 's1',
          title: 'Planning',
          workout_template_id: 't1',
        }),
      ],
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.kind).toBe('schedule')
  })
})

describe('shouldUseTemplateCatalogAccordions', () => {
  it('returns false for a single ungrouped bucket', () => {
    expect(
      shouldUseTemplateCatalogAccordions([
        { id: 'other', title: 'Autres', kind: 'other', templates: [] },
      ]),
    ).toBe(false)
  })

  it('returns true when folders or schedules exist', () => {
    expect(
      shouldUseTemplateCatalogAccordions([
        { id: 'folder-a', title: 'Force', kind: 'folder', templates: [] },
        { id: 'other', title: 'Autres', kind: 'other', templates: [] },
      ]),
    ).toBe(true)
  })
})
