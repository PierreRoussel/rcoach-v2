import { scrollElementIntoViewWhenReady } from '@/lib/stats/scroll-to-featured'

export const WORKOUT_EXERCISE_SELECTOR_ATTR = 'data-workout-exercise-id'

export function getWorkoutExerciseElement(exerciseId: string) {
  return document.querySelector(
    `[${WORKOUT_EXERCISE_SELECTOR_ATTR}="${CSS.escape(exerciseId)}"]`,
  ) as HTMLElement | null
}

export function scrollToWorkoutExercise(
  exerciseId: string,
  options?: Parameters<typeof scrollElementIntoViewWhenReady>[1],
) {
  return scrollElementIntoViewWhenReady(() => getWorkoutExerciseElement(exerciseId), {
    behavior: 'smooth',
    block: 'center',
    ...options,
  })
}
