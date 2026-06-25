import {
  buildCircuitSteps,
  findNextStepIndexAfter,
  type CircuitExercise,
  type CircuitStep,
} from '@/lib/workout/workout-circuit'
import type { ExerciseLocale } from '@/lib/workout/exercise-translations'
import { translateExerciseName } from '@/lib/workout/translate-exercise-name'

export function formatActiveWorkoutElapsed(
  startedAt: string,
  now: Date = new Date(),
): string {
  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime())
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function countPendingSets(exercise: CircuitExercise): number {
  return exercise.sets.filter((set) => !set.completedAt).length
}

export function getWorkoutEncouragementMessage(
  exercises: CircuitExercise[],
  lastCompletedStep: CircuitStep | null,
  locale: ExerciseLocale = 'fr',
): string {
  if (exercises.length === 0) {
    return 'Ajoutez des exercices pour avancer'
  }

  const steps = buildCircuitSteps(exercises)
  const nextIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)

  if (nextIndex == null) {
    if (steps.length === 0) {
      return 'Planifiez des series pour commencer'
    }

    return 'Toutes les series sont faites — terminez la seance !'
  }

  const nextStep = steps[nextIndex]
  if (!nextStep) {
    return 'Continuez comme ca !'
  }

  const exercise = exercises[nextStep.exerciseIndex]
  const exerciseName = translateExerciseName(
    exercise?.exerciseName ?? 'cet exercice',
    locale,
  )
  const pendingInExercise = exercise ? countPendingSets(exercise) : 0
  const exercisesWithPending = exercises.filter(
    (entry) => countPendingSets(entry) > 0,
  ).length
  const totalPending = exercises.reduce(
    (total, entry) => total + countPendingSets(entry),
    0,
  )

  if (pendingInExercise === 1) {
    return `Plus qu'1 serie de ${exerciseName} !`
  }

  if (pendingInExercise === 2) {
    return `Plus que 2 series de ${exerciseName} !`
  }

  if (exercisesWithPending === 1) {
    return 'Un dernier exercice avant la fin !'
  }

  if (totalPending <= 3) {
    return `Encore ${totalPending} series et c'est fini !`
  }

  return `Prochaine etape : ${exerciseName}`
}
