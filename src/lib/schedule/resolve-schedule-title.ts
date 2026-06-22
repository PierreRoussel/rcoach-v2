export function resolveScheduleTitle(
  values: {
    title: string
    workoutTemplateId: string | null
  },
  templates: Array<{ id: string; name: string }>,
) {
  const trimmedTitle = values.title.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  if (!values.workoutTemplateId) {
    return ''
  }

  const template = templates.find(
    (entry) => entry.id === values.workoutTemplateId,
  )

  return template?.name.trim() ?? ''
}
