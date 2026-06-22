export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  role: 'athlete' | 'coach' | 'both'
  unit_system: 'kg' | 'lb'
  rpe_enabled: boolean
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
  share_token?: string | null
  workout_exercises: Array<{
    id: string
    exercise: {
      id: string
      name: string
      muscle_group: string | null
      equipment: string | null
    }
    sets: Array<{
      set_index: number
      weight_kg: number | null
      reps: number | null
      set_type: string
      rpe: number | null
    }>
  }>
}

export type WorkoutTemplateSet = {
  set_index: number
  weight_kg: number | null
  reps: number | null
  rest_seconds: number
}

export type WorkoutTemplateExercise = {
  id: string
  sort_order: number
  superset_id?: number | null
  default_rest_seconds?: number
  exercise: Exercise
  workout_template_sets: WorkoutTemplateSet[]
}

export type WorkoutTemplate = {
  id: string
  name: string
  created_at: string
  updated_at: string
  default_rest_seconds: number
  source_workout_id?: string | null
  workout_template_exercises: WorkoutTemplateExercise[]
}

export type WorkoutDetail = Omit<WorkoutSummary, 'workout_exercises'> & {
  notes: string | null
  share_token?: string | null
  workout_exercises: Array<{
    id: string
    sort_order: number
    exercise: {
      id: string
      name: string
      muscle_group: string | null
      equipment: string | null
    }
    sets: Array<{
      set_index: number
      weight_kg: number | null
      reps: number | null
      set_type: string
      duration_seconds: number | null
      distance_km: number | null
      rpe: number | null
    }>
  }>
}

export type SharedWorkoutDetail = WorkoutDetail & {
  user: { display_name: string } | null
}

export type ProfileUpdateInput = {
  display_name?: string
  unit_system?: 'kg' | 'lb'
  role?: 'athlete' | 'coach' | 'both'
  rpe_enabled?: boolean
}

export const UPDATE_MY_PROFILE = `
  mutation UpdateMyProfile($id: uuid!, $changes: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
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
          id
          name
          muscle_group
          equipment
        }
        sets {
          set_index
          weight_kg
          reps
          set_type
          rpe
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
      rpe_enabled
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

export type CoachClient = {
  id: string
  coach_id: string
  athlete_id: string | null
  invited_email: string | null
  status: 'pending' | 'active' | 'archived'
  created_at: string
  athlete: { id: string; display_name: string } | null
}

export type ProgramDay = {
  id: string
  name: string
  sort_order: number
  program_exercises: Array<{
    id: string
    sort_order: number
    target_sets: number | null
    target_reps: string | null
    notes: string | null
    exercise: Exercise
  }>
}

export type Program = {
  id: string
  name: string
  description: string | null
  is_template: boolean
  created_at: string
  program_days: ProgramDay[]
}

export type ClientWorkout = {
  id: string
  title: string
  started_at: string
  ended_at: string | null
  user: { id: string; display_name: string }
  workout_exercises: Array<{
    exercise: { name: string; muscle_group: string | null }
    sets: Array<{
      weight_kg: number | null
      reps: number | null
      set_type: string
    }>
  }>
}

export const LIST_MY_COACH_CLIENTS = `
  query ListMyCoachClients {
    coach_clients(order_by: { created_at: desc }) {
      id
      coach_id
      athlete_id
      invited_email
      status
      created_at
      athlete {
        id
        display_name
      }
    }
  }
`

export const INSERT_COACH_CLIENT = `
  mutation InsertCoachClient($object: coach_clients_insert_input!) {
    insert_coach_clients_one(object: $object) {
      id
      invited_email
      status
      created_at
    }
  }
`

export const UPDATE_COACH_CLIENT_STATUS = `
  mutation UpdateCoachClientStatus($id: uuid!, $status: String!) {
    update_coach_clients_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`

export const LIST_MY_PROGRAMS = `
  query ListMyPrograms {
    programs(order_by: { created_at: desc }) {
      id
      name
      description
      is_template
      created_at
      program_days(order_by: { sort_order: asc }) {
        id
        name
        sort_order
        program_exercises(order_by: { sort_order: asc }) {
          id
          sort_order
          target_sets
          target_reps
          notes
          exercise {
            id
            name
            muscle_group
            equipment
          }
        }
      }
    }
  }
`

export const GET_PROGRAM = `
  query GetProgram($id: uuid!) {
    programs_by_pk(id: $id) {
      id
      name
      description
      is_template
      created_at
      program_days(order_by: { sort_order: asc }) {
        id
        name
        sort_order
        program_exercises(order_by: { sort_order: asc }) {
          id
          sort_order
          target_sets
          target_reps
          notes
          exercise {
            id
            name
            muscle_group
            equipment
          }
        }
      }
    }
  }
`

export const INSERT_PROGRAM = `
  mutation InsertProgram($object: programs_insert_input!) {
    insert_programs_one(object: $object) {
      id
      name
      description
      is_template
    }
  }
`

export const UPDATE_PROGRAM = `
  mutation UpdateProgram($id: uuid!, $changes: programs_set_input!) {
    update_programs_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      name
      description
      is_template
    }
  }
`

export const INSERT_PROGRAM_DAY = `
  mutation InsertProgramDay($object: program_days_insert_input!) {
    insert_program_days_one(object: $object) {
      id
      name
      sort_order
    }
  }
`

export const INSERT_PROGRAM_EXERCISE = `
  mutation InsertProgramExercise($object: program_exercises_insert_input!) {
    insert_program_exercises_one(object: $object) {
      id
      sort_order
      target_sets
      target_reps
      exercise {
        id
        name
      }
    }
  }
`

export const DELETE_PROGRAM_EXERCISE = `
  mutation DeleteProgramExercise($id: uuid!) {
    delete_program_exercises_by_pk(id: $id) {
      id
    }
  }
`

export const LIST_CLIENT_WORKOUTS = `
  query ListClientWorkouts($limit: Int = 50) {
    workouts(
      where: {
        user: {
          coach_clients_as_athlete: { status: { _eq: active } }
        }
      }
      order_by: { started_at: desc }
      limit: $limit
    ) {
      id
      title
      started_at
      ended_at
      user {
        id
        display_name
      }
      workout_exercises {
        exercise {
          name
          muscle_group
        }
        sets {
          weight_kg
          reps
          set_type
        }
      }
    }
  }
`

const GET_WORKOUT_BY_ID_FIELDS = `
      id
      title
      started_at
      ended_at
      notes
      workout_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        exercise {
          id
          name
          muscle_group
          equipment
        }
        sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          set_type
          duration_seconds
          distance_km
          rpe
        }
      }
`

export const GET_WORKOUT_BY_ID = `
  query GetWorkoutById($id: uuid!) {
    workouts_by_pk(id: $id) {
      share_token
${GET_WORKOUT_BY_ID_FIELDS}
    }
  }
`

export const GET_WORKOUT_BY_ID_WITHOUT_SHARE = `
  query GetWorkoutByIdWithoutShare($id: uuid!) {
    workouts_by_pk(id: $id) {
${GET_WORKOUT_BY_ID_FIELDS}
    }
  }
`

export const GET_SHARED_WORKOUT_BY_TOKEN = `
  query GetSharedWorkoutByToken($token: uuid!) {
    workouts(where: { share_token: { _eq: $token } }, limit: 1) {
      id
      title
      started_at
      ended_at
      notes
      share_token
      user {
        display_name
      }
      workout_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        exercise {
          id
          name
          muscle_group
          equipment
        }
        sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          set_type
          duration_seconds
          distance_km
          rpe
        }
      }
    }
  }
`

export const ENABLE_WORKOUT_SHARE = `
  mutation EnableWorkoutShare($id: uuid!, $shareToken: uuid!) {
    update_workouts_by_pk(
      pk_columns: { id: $id }
      _set: { share_token: $shareToken }
    ) {
      id
      share_token
    }
  }
`

export const GET_TEMPLATE_BY_SOURCE_WORKOUT = `
  query TemplateBySourceWorkout($workoutId: uuid!) {
    workout_templates(
      where: { source_workout_id: { _eq: $workoutId } }
      limit: 1
    ) {
      id
      name
    }
  }
`

export const LIST_MY_WORKOUT_TEMPLATES = `
  query ListMyWorkoutTemplates {
    workout_templates(order_by: { updated_at: desc }) {
      id
      name
      created_at
      updated_at
      default_rest_seconds
      workout_template_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        exercise {
          id
          name
          muscle_group
          equipment
        }
        workout_template_sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          rest_seconds
        }
      }
    }
  }
`

export const GET_WORKOUT_TEMPLATE = `
  query GetWorkoutTemplate($id: uuid!) {
    workout_templates_by_pk(id: $id) {
      id
      name
      created_at
      updated_at
      default_rest_seconds
      workout_template_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        exercise {
          id
          name
          muscle_group
          equipment
        }
        workout_template_sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          rest_seconds
        }
      }
    }
  }
`

export const INSERT_WORKOUT_TEMPLATE = `
  mutation InsertWorkoutTemplate($object: workout_templates_insert_input!) {
    insert_workout_templates_one(object: $object) {
      id
      name
      workout_template_exercises {
        id
        sort_order
        exercise {
          id
          name
        }
      }
    }
  }
`

export const UPDATE_WORKOUT_TEMPLATE = `
  mutation UpdateWorkoutTemplate(
    $id: uuid!
    $name: String!
    $defaultRestSeconds: Int!
  ) {
    update_workout_templates_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        default_rest_seconds: $defaultRestSeconds
        updated_at: "now()"
      }
    ) {
      id
      name
      default_rest_seconds
      updated_at
    }
  }
`

export const DELETE_WORKOUT_TEMPLATE_EXERCISES = `
  mutation DeleteWorkoutTemplateExercises($templateId: uuid!) {
    delete_workout_template_exercises(
      where: { template_id: { _eq: $templateId } }
    ) {
      affected_rows
    }
  }
`

export const INSERT_WORKOUT_TEMPLATE_EXERCISES = `
  mutation InsertWorkoutTemplateExercises(
    $objects: [workout_template_exercises_insert_input!]!
  ) {
    insert_workout_template_exercises(objects: $objects) {
      returning {
        id
        sort_order
        exercise {
          id
          name
        }
        workout_template_sets {
          set_index
          weight_kg
          reps
          rest_seconds
        }
      }
    }
  }
`

export const DELETE_WORKOUT_TEMPLATE = `
  mutation DeleteWorkoutTemplate($id: uuid!) {
    delete_workout_templates_by_pk(id: $id) {
      id
    }
  }
`
