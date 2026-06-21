export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  role: 'athlete' | 'coach' | 'both'
  unit_system: 'kg' | 'lb'
  created_at: string
}

export type Exercise = {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  is_public: boolean
}

export type WorkoutSummary = {
  id: string
  title: string
  started_at: string
  ended_at: string | null
  workout_exercises: Array<{
    id: string
    exercise: { name: string; muscle_group: string | null }
    sets: Array<{
      set_index: number
      weight_kg: number | null
      reps: number | null
      set_type: string
    }>
  }>
}

export type ProfileUpdateInput = {
  display_name?: string
  unit_system?: 'kg' | 'lb'
}

export const UPDATE_MY_PROFILE = `
  mutation UpdateMyProfile($id: uuid!, $changes: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      display_name
      avatar_url
      role
      unit_system
      created_at
    }
  }
`

export const LIST_MY_WORKOUTS = `
  query ListMyWorkouts {
    workouts(order_by: { started_at: desc }, limit: 100) {
      id
      title
      started_at
      ended_at
      workout_exercises {
        id
        exercise {
          name
          muscle_group
        }
        sets {
          set_index
          weight_kg
          reps
          set_type
        }
      }
    }
  }
`

export const GET_MY_PROFILE = `
  query GetMyProfile {
    profiles(limit: 1) {
      id
      display_name
      avatar_url
      role
      unit_system
      created_at
    }
  }
`

export const LIST_PUBLIC_EXERCISES = `
  query ListPublicExercises {
    exercises(
      where: { is_public: { _eq: true } }
      order_by: { name: asc }
    ) {
      id
      name
      muscle_group
      equipment
      is_public
    }
  }
`

export const LIST_ALL_EXERCISES = `
  query ListAllExercises {
    exercises(order_by: { name: asc }) {
      id
      name
      muscle_group
      equipment
      is_public
      created_by
    }
  }
`

export const INSERT_EXERCISE = `
  mutation InsertExercise($object: exercises_insert_input!) {
    insert_exercises_one(object: $object) {
      id
      name
      muscle_group
      equipment
      is_public
    }
  }
`

export const GET_LAST_EXERCISE_PERFORMANCE = `
  query GetLastExercisePerformance($exerciseId: uuid!) {
    workout_exercises(
      where: { exercise_id: { _eq: $exerciseId } }
      order_by: { workout: { started_at: desc } }
      limit: 1
    ) {
      workout {
        title
        started_at
      }
      exercise {
        name
        equipment
        muscle_group
      }
      sets(order_by: { set_index: asc }) {
        set_index
        set_type
        weight_kg
        reps
        duration_seconds
        distance_km
      }
    }
  }
`

export const INSERT_WORKOUT = `
  mutation InsertWorkout($object: workouts_insert_input!) {
    insert_workouts_one(object: $object) {
      id
      title
      started_at
      workout_exercises {
        id
        exercise {
          name
        }
        sets {
          id
          set_index
          weight_kg
          reps
        }
      }
    }
  }
`
