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

export const GET_MY_PROFILE = `
  query GetMyProfile($userId: uuid!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
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
