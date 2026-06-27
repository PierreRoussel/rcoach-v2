import { FetchError } from '@nhost/nhost-js/fetch'

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase()
  }

  return String(error).toLowerCase()
}

export function isOfflineLikeError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true
  }

  if (error instanceof TypeError) {
    const message = errorMessage(error)
    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('load failed')
    )
  }

  if (error instanceof FetchError) {
    if (error.status === 0) {
      return true
    }

    return error.status >= 500 || error.status === 408 || error.status === 429
  }

  const message = errorMessage(error)

  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('network request failed') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted') ||
    message.includes('load failed') ||
    message.includes('réponse graphql vide')
  )
}

export function isUnrecoverableNutritionSyncError(error: unknown) {
  const message = errorMessage(error)

  return (
    message.includes('not authenticated') ||
    message.includes('unauthorized') ||
    message.includes('permission denied') ||
    message.includes('invalid input syntax') ||
    message.includes('violates check constraint')
  )
}

type QueueNutritionMutationOptions = {
  hasLocalFoodReference?: boolean
}

export function shouldQueueNutritionMutation(
  error: unknown,
  options: QueueNutritionMutationOptions = {},
) {
  if (options.hasLocalFoodReference) {
    return true
  }

  if (isOfflineLikeError(error)) {
    return true
  }

  const message = errorMessage(error)

  return (
    message.includes('foreign key') ||
    message.includes('food_id') ||
    message.includes('insert or update on table')
  )
}
