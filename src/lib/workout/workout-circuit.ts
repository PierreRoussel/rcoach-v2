import { buildExerciseUnits } from '@/lib/workout/exercise-units'

export type CircuitSet = {
  setIndex: number
  restSeconds?: number | null
  completedAt?: string | null
  weightKg?: number | null
  reps?: number | null
  setType?: 'normal' | 'warmup' | 'failure'
  rpe?: number | null
}

export type CircuitExercise = {
  exerciseId: string
  exerciseName: string
  supersetId?: number | null
  defaultRestSeconds?: number
  sets: CircuitSet[]
}

export type CircuitStep = {
  exerciseIndex: number
  setIndex: number
}

export function buildCircuitSteps(exercises: CircuitExercise[]): CircuitStep[] {
  const steps: CircuitStep[] = []
  const units = buildExerciseUnits(exercises)

  for (const unit of units) {
    if (unit.type === 'single') {
      const exercise = exercises[unit.index]
      if (!exercise) {
        continue
      }

      for (const set of exercise.sets) {
        steps.push({ exerciseIndex: unit.index, setIndex: set.setIndex })
      }
      continue
    }

    const maxRounds = Math.max(
      0,
      ...unit.indices.map((exerciseIndex) => exercises[exerciseIndex]?.sets.length ?? 0),
    )

    for (let round = 0; round < maxRounds; round += 1) {
      for (const exerciseIndex of unit.indices) {
        const exercise = exercises[exerciseIndex]
        if (!exercise?.sets[round]) {
          continue
        }

        steps.push({ exerciseIndex, setIndex: round })
      }
    }
  }

  return steps
}

export function stepKey(step: CircuitStep) {
  return `${step.exerciseIndex}:${step.setIndex}`
}

export function isStepCompleted(
  exercises: CircuitExercise[],
  step: CircuitStep,
): boolean {
  return Boolean(exercises[step.exerciseIndex]?.sets[step.setIndex]?.completedAt)
}

export function findNextPendingStepIndex(
  steps: CircuitStep[],
  exercises: CircuitExercise[],
  fromIndex = 0,
): number | null {
  for (let index = fromIndex; index < steps.length; index += 1) {
    const step = steps[index]
    if (!step) {
      continue
    }

    if (!isStepCompleted(exercises, step)) {
      return index
    }
  }

  return null
}

export function isIntraSupersetTransition(
  exercises: CircuitExercise[],
  fromStep: CircuitStep,
  toStep: CircuitStep | null,
): boolean {
  if (!toStep) {
    return false
  }

  const fromExercise = exercises[fromStep.exerciseIndex]
  const toExercise = exercises[toStep.exerciseIndex]

  if (
    fromExercise?.supersetId == null ||
    fromExercise.supersetId !== toExercise?.supersetId
  ) {
    return false
  }

  return (
    fromStep.exerciseIndex !== toStep.exerciseIndex &&
    fromStep.setIndex === toStep.setIndex
  )
}

export function getStepRestSeconds(
  exercises: CircuitExercise[],
  completedStep: CircuitStep,
  nextStep: CircuitStep | null,
  defaultRestSeconds: number,
): number {
  if (!nextStep) {
    return 0
  }

  if (isIntraSupersetTransition(exercises, completedStep, nextStep)) {
    return 0
  }

  const completedSet = exercises[completedStep.exerciseIndex]?.sets[completedStep.setIndex]
  if (completedSet?.restSeconds != null) {
    return completedSet.restSeconds
  }

  const exercise = exercises[completedStep.exerciseIndex]
  if (exercise?.defaultRestSeconds != null) {
    return exercise.defaultRestSeconds
  }

  return defaultRestSeconds
}

export function isWorkoutComplete(
  steps: CircuitStep[],
  exercises: CircuitExercise[],
): boolean {
  if (steps.length === 0) {
    return false
  }

  return findNextPendingStepIndex(steps, exercises, 0) == null
}

export function countCompletedSets(exercises: CircuitExercise[]): number {
  return exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => Boolean(set.completedAt)).length,
    0,
  )
}

export function getStepLabel(
  exercises: CircuitExercise[],
  step: CircuitStep | null,
): string | null {
  if (!step) {
    return null
  }

  const exercise = exercises[step.exerciseIndex]
  if (!exercise) {
    return null
  }

  return `${exercise.exerciseName} — série ${step.setIndex + 1}`
}

export function getValidatedExercisesForSync(exercises: CircuitExercise[]) {
  return exercises
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets
        .filter((set) => Boolean(set.completedAt))
        .map((set, index) => ({
          ...set,
          setIndex: index,
        })),
    }))
    .filter((exercise) => exercise.sets.length > 0)
}
