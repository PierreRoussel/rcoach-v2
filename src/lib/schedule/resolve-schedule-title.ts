export function resolveScheduleTitle(
  values: {
    title: string
    workoutTemplateId: string | null
    workoutTemplateIdB?: string | null
    recurrenceType?: 'once' | 'weekly' | 'aba'
  },
  templates: Array<{ id: string; name: string }>,
) {
  const trimmedTitle = values.title.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  const templateA = values.workoutTemplateId
    ? templates.find((entry) => entry.id === values.workoutTemplateId)
    : null

  if (values.recurrenceType === 'aba' && values.workoutTemplateIdB) {
    const templateB = templates.find(
      (entry) => entry.id === values.workoutTemplateIdB,
    )
    const nameA = templateA?.name.trim()
    const nameB = templateB?.name.trim()

    if (nameA && nameB) {
      return `${nameA} / ${nameB}`
    }
  }

  return templateA?.name.trim() ?? ''
}
