export type PlanningSearchParams = {
  date?: string
  templateId?: string
  title?: string
  schedule?: boolean
}

export function buildPlanningSearchParams(
  options: {
    date?: string
    templateId?: string
    title?: string
    openScheduleForm?: boolean
  } = {},
): PlanningSearchParams {
  const search: PlanningSearchParams = {}

  if (options.date) {
    search.date = options.date
  }

  if (options.templateId) {
    search.templateId = options.templateId
  }

  const trimmedTitle = options.title?.trim()
  if (trimmedTitle) {
    search.title = trimmedTitle
  }

  if (options.openScheduleForm) {
    search.schedule = true
  }

  return search
}
