export type ProfileRole = 'athlete' | 'coach' | 'both' | 'admin'

export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  friend_code?: string | null
  role: ProfileRole
  unit_system: 'kg' | 'lb'
  rpe_enabled: boolean
  exercise_locale?: 'fr' | 'en'
  onboarding_completed_at?: string | null
  is_premium?: boolean
  goal_coaching_reminders_enabled?: boolean
  created_at: string
}

export type SubscriptionTier = 'free' | 'premium'

export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due'

export type BillingPeriod = 'monthly' | 'annual'

export type SubscriptionProvider = 'none' | 'play' | 'stripe' | 'revenuecat'

export type Subscription = {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  billing_period: BillingPeriod | null
  current_period_end: string | null
  provider: SubscriptionProvider
  provider_ref: string | null
  trial_consumed_at: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionUpdateInput = {
  tier?: SubscriptionTier
  status?: SubscriptionStatus
  billing_period?: BillingPeriod | null
  current_period_end?: string | null
  provider?: SubscriptionProvider
  provider_ref?: string | null
}

export type CancellationFeedbackInput = {
  reason?: string | null
  comment?: string | null
}

export type Exercise = {
  id: string
  name: string
  name_fr?: string | null
  muscle_group: string | null
  equipment: string | null
  is_public: boolean
  tracking_mode?: string | null
  description_fr?: string | null
  description_en?: string | null
  coaching_cues?: unknown
  demo_file_id?: string | null
  demo_poster_file_id?: string | null
  content_status?: string | null
  content_source?: string | null
}

export type WorkoutSummary = {
  id: string
  title: string
  started_at: string
  ended_at: string | null
  share_token?: string | null
  workout_template_id?: string | null
  workout_exercises: Array<{
    id: string
    exercise: {
      id: string
      name: string
      name_fr?: string | null
      muscle_group: string | null
      equipment: string | null
    } | null
    sets: Array<{
      set_index: number
      weight_kg: number | null
      reps: number | null
      set_type: string
      rpe: number | null
    }>
  }>
}

export type WorkoutHeaderSummary = Pick<
  WorkoutSummary,
  'id' | 'title' | 'started_at' | 'ended_at' | 'workout_template_id'
>

export type CalendarWorkoutSummary = WorkoutHeaderSummary

export type WorkoutTemplateSet = {
  set_index: number
  weight_kg: number | null
  reps: number | null
  rest_seconds: number
  set_type?: string
  duration_seconds?: number | null
}

export type WorkoutTemplateExercise = {
  id: string
  sort_order: number
  superset_id?: number | null
  default_rest_seconds?: number
  target_reps?: number | null
  target_weight_kg?: number | null
  emom_group_id?: number | null
  exercise: Exercise
  workout_template_sets: WorkoutTemplateSet[]
}

export type WorkoutTemplate = {
  id: string
  name: string
  folder_name?: string | null
  created_at: string
  updated_at: string
  default_rest_seconds: number
  source_workout_id?: string | null
  share_token?: string | null
  session_mode?: string | null
  emom_interval_seconds?: number | null
  emom_total_minutes?: number | null
  workout_template_exercises: WorkoutTemplateExercise[]
}

export type SharedWorkoutTemplate = WorkoutTemplate & {
  user: { display_name: string } | null
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
      name_fr?: string | null
      muscle_group: string | null
      equipment: string | null
    } | null
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
  avatar_url?: string | null
  unit_system?: 'kg' | 'lb'
  role?: Exclude<ProfileRole, 'admin'>
  rpe_enabled?: boolean
  exercise_locale?: 'fr' | 'en'
  onboarding_completed_at?: string | null
  goal_coaching_reminders_enabled?: boolean
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string | null
  invited_email: string | null
  status: FriendshipStatus
  created_at: string
  requester?: FriendProfileSummary | null
  addressee?: FriendProfileSummary | null
}

export type FriendProfileSummary = {
  id: string
  display_name: string
  avatar_url: string | null
  friend_code?: string | null
  is_premium?: boolean
  workouts: Array<{ started_at: string }>
  meal_log_entries: Array<{ logged_date: string; calories: number }>
}

export type FriendMotivation = {
  id: string
  sender_id: string
  recipient_id: string
  emoji: string
  message: string
  preset_key: 'fire' | 'muscle' | 'clap' | 'custom'
  read_at: string | null
  hearted_at: string | null
  reply_message: string | null
  sender_reply_seen_at: string | null
  created_at: string
  sender?: {
    id: string
    display_name: string
    avatar_url: string | null
    is_premium?: boolean
  } | null
  recipient?: {
    id: string
    display_name: string
    avatar_url: string | null
    is_premium?: boolean
  } | null
}

export type UserBadge = {
  id: string
  user_id: string
  badge_key: string
  unlocked_at: string
}

export type BadgeDefinitionRow = {
  key: string
  label: string
  description: string
  category: 'discipline' | 'records' | 'volume' | 'sessions'
  tier: 'bronze' | 'silver' | 'gold'
  icon_name: string
  rule_type:
    | 'nutrition_streak'
    | 'workout_streak'
    | 'sessions'
    | 'pr_count'
    | 'volume_kg'
    | 'manual'
  rule_threshold: number | null
  is_active: boolean
  sort_order: number
  unlock_count: number
  unlock_percent: number
  created_at: string
  updated_at: string
}

export type FriendProfileDetail = {
  id: string
  display_name: string
  avatar_url: string | null
  is_premium?: boolean
  user_badges: UserBadge[]
  workouts: WorkoutSummary[]
  meal_log_entries: Array<{ logged_date: string; calories: number }>
}

export type FriendBadgesProfile = {
  id: string
  display_name: string
  avatar_url: string | null
  is_premium?: boolean
  user_badges: UserBadge[]
  workouts: WorkoutSummary[]
}

export const GET_MY_AUTH_USER_LOCALE = `
  query GetMyAuthUserLocale($id: uuid!) {
    user(id: $id) {
      id
      locale
    }
  }
`

export const UPDATE_MY_AUTH_USER_LOCALE = `
  mutation UpdateMyAuthUserLocale($id: uuid!, $locale: String!) {
    updateUser(pk_columns: { id: $id }, _set: { locale: $locale }) {
      id
      locale
    }
  }
`

export const UPDATE_MY_PROFILE = `
  mutation UpdateMyProfile($id: uuid!, $changes: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      onboarding_completed_at
      goal_coaching_reminders_enabled
      created_at
    }
  }
`

/** Fallback when goal_coaching_reminders_enabled migration is not deployed yet. */
export const UPDATE_MY_PROFILE_GOAL_COACHING_LEGACY = `
  mutation UpdateMyProfileGoalCoachingLegacy($id: uuid!, $changes: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      onboarding_completed_at
      created_at
    }
  }
`

/** Fallback when onboarding_completed_at migration is not deployed yet. */
export const UPDATE_MY_PROFILE_ONBOARDING_LEGACY = `
  mutation UpdateMyProfileOnboardingLegacy($id: uuid!, $changes: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      created_at
    }
  }
`

/** Fallback when exercise_locale migration is not deployed yet. */
export const UPDATE_MY_PROFILE_LEGACY = `
  mutation UpdateMyProfileLegacy($id: uuid!, $changes: profiles_set_input!) {
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
  query ListMyWorkouts($userId: uuid!) {
    workouts(
      where: { user_id: { _eq: $userId } }
      order_by: { started_at: desc }
      limit: 100
    ) {
      id
      title
      started_at
      ended_at
      share_token
      workout_template_id
      workout_exercises {
        id
        exercise {
          id
          name
          name_fr
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

export const GET_MY_LAST_COMPLETED_WORKOUT = `
  query GetMyLastCompletedWorkout($userId: uuid!) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        ended_at: { _is_null: false }
      }
      order_by: { started_at: desc }
      limit: 1
    ) {
      id
      title
      started_at
      ended_at
      share_token
      workout_template_id
      workout_exercises {
        id
        exercise {
          id
          name
          name_fr
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

export const LIST_MY_WORKOUTS_IN_RANGE = `
  query ListMyWorkoutsInRange(
    $userId: uuid!
    $start: timestamptz!
    $end: timestamptz!
  ) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        started_at: { _gte: $start, _lte: $end }
      }
      order_by: { started_at: desc }
    ) {
      id
      title
      started_at
      ended_at
      workout_template_id
    }
  }
`

export const LIST_MY_WORKOUT_STREAK_DATES = `
  query ListMyWorkoutStreakDates($userId: uuid!, $since: timestamptz!) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        ended_at: { _is_null: false }
        started_at: { _gte: $since }
      }
      order_by: { started_at: desc }
    ) {
      started_at
    }
  }
`

export const WORKOUTS_PAGE_SIZE = 15
export const HISTORY_WORKOUTS_INITIAL_PAGE_SIZE = 4
export const HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE = 10

export const LIST_MY_WORKOUTS_PAGE = `
  query ListMyWorkoutsPage($userId: uuid!, $limit: Int!, $offset: Int!) {
    workouts(
      where: { user_id: { _eq: $userId } }
      order_by: { started_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      title
      started_at
      ended_at
      share_token
      workout_template_id
      workout_exercises {
        id
        exercise {
          id
          name
          name_fr
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

export const LIST_MY_WORKOUTS_STATS_PAGE = `
  query ListMyWorkoutsStatsPage(
    $userId: uuid!
    $limit: Int!
    $offset: Int!
    $start: timestamptz!
    $end: timestamptz!
  ) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        ended_at: { _is_null: false }
        started_at: { _gte: $start, _lte: $end }
      }
      order_by: { started_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      title
      started_at
      ended_at
      share_token
      workout_template_id
      workout_exercises {
        id
        exercise {
          id
          name
          name_fr
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

export const LIST_MY_WORKOUTS_STATS_ALL_PAGE = `
  query ListMyWorkoutsStatsAllPage($userId: uuid!, $limit: Int!, $offset: Int!) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        ended_at: { _is_null: false }
      }
      order_by: { started_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      title
      started_at
      ended_at
      share_token
      workout_template_id
      workout_exercises {
        id
        exercise {
          id
          name
          name_fr
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
  query GetMyProfile($userId: uuid!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      friend_code
      is_premium
      onboarding_completed_at
      goal_coaching_reminders_enabled
      created_at
    }
  }
`

/** Fallback when goal_coaching_reminders_enabled migration is not deployed yet. */
export const GET_MY_PROFILE_GOAL_COACHING_LEGACY = `
  query GetMyProfileGoalCoachingLegacy($userId: uuid!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      friend_code
      is_premium
      onboarding_completed_at
      created_at
    }
  }
`

export const GET_MY_AUTH_PROVIDERS = `
  query GetMyAuthProviders {
    authUserProviders {
      providerId
    }
  }
`

export const ENSURE_USER_PROFILE = `
  mutation EnsureUserProfile {
    ensure_user_profile {
      id
    }
  }
`

export const RECORD_LEGAL_CONSENT = `
  mutation RecordLegalConsent {
    record_legal_consent {
      value
    }
  }
`

export const DELETE_MY_ACCOUNT = `
  mutation DeleteMyAccount {
    delete_my_account {
      value
    }
  }
`

export const COMPLETE_MY_ONBOARDING = `
  mutation CompleteMyOnboarding {
    complete_my_onboarding {
      value
    }
  }
`

/** Fallback when onboarding_completed_at migration is not deployed yet. */
export const GET_MY_PROFILE_ONBOARDING_LEGACY = `
  query GetMyProfileOnboardingLegacy($userId: uuid!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      display_name
      avatar_url
      role
      unit_system
      rpe_enabled
      exercise_locale
      friend_code
      created_at
    }
  }
`

/** Fallback when exercise_locale migration is not deployed yet. */
export const GET_MY_PROFILE_LEGACY = `
  query GetMyProfileLegacy($userId: uuid!) {
    profiles(where: { id: { _eq: $userId } }, limit: 1) {
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
      name_fr
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
      name_fr
      muscle_group
      equipment
      is_public
      tracking_mode
      created_by
    }
  }
`

export const INSERT_EXERCISE = `
  mutation InsertExercise($object: exercises_insert_input!) {
    insert_exercises_one(object: $object) {
        id
        name
        name_fr
        muscle_group
      equipment
      is_public
      tracking_mode
      content_status
    }
  }
`

export const GET_EXERCISE_CONTENT = `
  query GetExerciseContent($id: uuid!) {
    exercises_by_pk(id: $id) {
        id
        name
        name_fr
        muscle_group
      equipment
      tracking_mode
      description_fr
      coaching_cues
      demo_file_id
      demo_poster_file_id
      content_status
      content_source
    }
  }
`

export const GET_LAST_EXERCISE_PERFORMANCE = `
  query GetLastExercisePerformance($exerciseId: uuid!) {
    workout_exercises(
      where: {
        exercise_id: { _eq: $exerciseId }
        workout: { ended_at: { _is_null: false } }
      }
      order_by: { workout: { started_at: desc } }
      limit: 1
    ) {
      workout {
        title
        started_at
      }
      exercise {
        name
        name_fr
        equipment
        muscle_group
        tracking_mode
      }
      sets(order_by: { set_index: asc }) {
        set_index
        set_type
        weight_kg
        reps
        duration_seconds
        distance_km
        rpe
      }
    }
  }
`

export const GET_LAST_TEMPLATE_WORKOUT = `
  query GetLastTemplateWorkout($userId: uuid!, $templateId: uuid!) {
    workouts(
      where: {
        user_id: { _eq: $userId }
        ended_at: { _is_null: false }
      }
      order_by: { started_at: desc }
      limit: 25
    ) {
      workout_template_id
      started_at
      workout_exercises(order_by: { sort_order: asc }) {
        exercise_id
        sets(order_by: { set_index: asc }) {
          set_index
          set_type
          weight_kg
          reps
          duration_seconds
          distance_km
          rpe
        }
      }
    }
    workout_templates_by_pk(id: $templateId) {
      id
      workout_template_exercises(order_by: { sort_order: asc }) {
        exercise {
          id
        }
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
        name_fr
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
        name_fr
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
      workout_template_id
      workout_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        exercise {
          id
          name
          name_fr
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
          name_fr
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

export const GET_SHARED_TEMPLATE_BY_TOKEN = `
  query GetSharedTemplateByToken($token: uuid!) {
    workout_templates(where: { share_token: { _eq: $token } }, limit: 1) {
      id
      name
      default_rest_seconds
      share_token
      session_mode
      emom_interval_seconds
      emom_total_minutes
      user {
        display_name
      }
      workout_template_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        superset_id
        default_rest_seconds
        target_reps
        target_weight_kg
        emom_group_id
        exercise {
          id
          name
          name_fr
          muscle_group
          equipment
        }
        workout_template_sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          rest_seconds
          set_type
          duration_seconds
        }
      }
    }
  }
`

export const ENABLE_TEMPLATE_SHARE = `
  mutation EnableTemplateShare($id: uuid!, $shareToken: uuid!) {
    update_workout_templates_by_pk(
      pk_columns: { id: $id }
      _set: { share_token: $shareToken }
    ) {
      id
      share_token
    }
  }
`

export const DELETE_WORKOUT = `
  mutation DeleteWorkout($id: uuid!) {
    delete_workouts_by_pk(id: $id) {
      id
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
      folder_name
      created_at
      updated_at
      default_rest_seconds
      share_token
      session_mode
      emom_interval_seconds
      emom_total_minutes
      workout_template_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        superset_id
        default_rest_seconds
        target_reps
        target_weight_kg
        emom_group_id
        exercise {
          id
          name
          name_fr
          muscle_group
          equipment
          tracking_mode
        }
        workout_template_sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          rest_seconds
          set_type
          duration_seconds
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
      folder_name
      created_at
      updated_at
      default_rest_seconds
      share_token
      session_mode
      emom_interval_seconds
      emom_total_minutes
      workout_template_exercises(order_by: { sort_order: asc }) {
        id
        sort_order
        superset_id
        default_rest_seconds
        target_reps
        target_weight_kg
        emom_group_id
        exercise {
          id
          name
          name_fr
          muscle_group
          equipment
          tracking_mode
        }
        workout_template_sets(order_by: { set_index: asc }) {
          set_index
          weight_kg
          reps
          rest_seconds
          set_type
          duration_seconds
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
    $folderName: String
    $sessionMode: String
    $emomIntervalSeconds: Int
    $emomTotalMinutes: Int
  ) {
    update_workout_templates_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        folder_name: $folderName
        default_rest_seconds: $defaultRestSeconds
        session_mode: $sessionMode
        emom_interval_seconds: $emomIntervalSeconds
        emom_total_minutes: $emomTotalMinutes
        updated_at: "now()"
      }
    ) {
      id
      name
      folder_name
      default_rest_seconds
      session_mode
      emom_interval_seconds
      emom_total_minutes
      updated_at
    }
  }
`

export const UPDATE_WORKOUT_TEMPLATE_SOURCE = `
  mutation UpdateWorkoutTemplateSource($id: uuid!, $sourceWorkoutId: uuid!) {
    update_workout_templates_by_pk(
      pk_columns: { id: $id }
      _set: { source_workout_id: $sourceWorkoutId }
    ) {
      id
      source_workout_id
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

export const INSERT_WORKOUT_TEMPLATE_SETS = `
  mutation InsertWorkoutTemplateSets(
    $objects: [workout_template_sets_insert_input!]!
  ) {
    insert_workout_template_sets(objects: $objects) {
      affected_rows
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

export type ScheduledSessionRecord = {
  id: string
  title: string
  workout_template_id: string | null
  workout_template_id_b?: string | null
  recurrence_type: 'once' | 'weekly' | 'aba'
  weekdays: number[] | null
  scheduled_date: string | null
  time_local: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  workout_template?: { id: string; name: string } | null
  workout_template_b?: { id: string; name: string } | null
}

export type ScheduledSessionInput = {
  title: string
  workout_template_id?: string | null
  workout_template_id_b?: string | null
  recurrence_type: 'once' | 'weekly' | 'aba'
  weekdays?: number[] | null
  scheduled_date?: string | null
  time_local?: string | null
  start_date: string
  end_date?: string | null
  is_active?: boolean
}

export const LIST_MY_SCHEDULED_SESSIONS = `
  query ListMyScheduledSessions {
    scheduled_sessions(
      where: { is_active: { _eq: true } }
      order_by: { start_date: asc }
    ) {
      id
      title
      workout_template_id
      workout_template_id_b
      recurrence_type
      weekdays
      scheduled_date
      time_local
      start_date
      end_date
      is_active
      created_at
      updated_at
      workout_template {
        id
        name
      }
      workout_template_b {
        id
        name
      }
    }
  }
`

export const LIST_ALL_MY_SCHEDULED_SESSIONS = `
  query ListAllMyScheduledSessions {
    scheduled_sessions(order_by: { updated_at: desc }) {
      id
      title
      workout_template_id
      workout_template_id_b
      recurrence_type
      weekdays
      scheduled_date
      time_local
      start_date
      end_date
      is_active
      created_at
      updated_at
      workout_template {
        id
        name
      }
      workout_template_b {
        id
        name
      }
    }
  }
`

export const INSERT_SCHEDULED_SESSION = `
  mutation InsertScheduledSession($object: scheduled_sessions_insert_input!) {
    insert_scheduled_sessions_one(object: $object) {
      id
      title
      workout_template_id
      workout_template_id_b
      recurrence_type
      weekdays
      scheduled_date
      time_local
      start_date
      end_date
      is_active
      workout_template {
        id
        name
      }
      workout_template_b {
        id
        name
      }
    }
  }
`

export const UPDATE_SCHEDULED_SESSION = `
  mutation UpdateScheduledSession(
    $id: uuid!
    $changes: scheduled_sessions_set_input!
  ) {
    update_scheduled_sessions_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      title
      workout_template_id
      workout_template_id_b
      recurrence_type
      weekdays
      scheduled_date
      time_local
      start_date
      end_date
      is_active
      updated_at
      workout_template {
        id
        name
      }
      workout_template_b {
        id
        name
      }
    }
  }
`

export const DELETE_SCHEDULED_SESSION = `
  mutation DeleteScheduledSession($id: uuid!) {
    delete_scheduled_sessions_by_pk(id: $id) {
      id
    }
  }
`

export type NutritionSettingsInput = {
  daily_calorie_target?: number
  carbs_pct?: number
  protein_pct?: number
  fat_pct?: number
  breakfast_pct?: number
  lunch_pct?: number
  snack_pct?: number
  dinner_pct?: number
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  calorie_adjustment?: number
  tdee_calculated?: number | null
  onboarded_at?: string | null
}

export const GET_NUTRITION_SETTINGS = `
  query GetNutritionSettings($userId: uuid!) {
    nutrition_settings_by_pk(user_id: $userId) {
      user_id
      daily_calorie_target
      carbs_pct
      protein_pct
      fat_pct
      breakfast_pct
      lunch_pct
      snack_pct
      dinner_pct
      activity_level
      calorie_adjustment
      tdee_calculated
      onboarded_at
      created_at
      updated_at
    }
  }
`

export const UPSERT_NUTRITION_SETTINGS = `
  mutation UpsertNutritionSettings($object: nutrition_settings_insert_input!) {
    insert_nutrition_settings_one(
      object: $object
      on_conflict: {
        constraint: nutrition_settings_pkey
        update_columns: [
          daily_calorie_target
          carbs_pct
          protein_pct
          fat_pct
          breakfast_pct
          lunch_pct
          snack_pct
          dinner_pct
          activity_level
          calorie_adjustment
          tdee_calculated
          onboarded_at
          updated_at
        ]
      }
    ) {
      user_id
      daily_calorie_target
      carbs_pct
      protein_pct
      fat_pct
      breakfast_pct
      lunch_pct
      snack_pct
      dinner_pct
      activity_level
      calorie_adjustment
      tdee_calculated
      onboarded_at
      created_at
      updated_at
    }
  }
`

export type UserMeasurementsInput = {
  sex?: 'male' | 'female' | null
  age?: number | null
  height_cm?: number | null
  waist_cm?: number | null
}

export const GET_USER_MEASUREMENTS = `
  query GetUserMeasurements($userId: uuid!) {
    user_measurements_by_pk(user_id: $userId) {
      user_id
      sex
      age
      height_cm
      waist_cm
      created_at
      updated_at
    }
  }
`

export const UPSERT_USER_MEASUREMENTS = `
  mutation UpsertUserMeasurements($object: user_measurements_insert_input!) {
    insert_user_measurements_one(
      object: $object
      on_conflict: {
        constraint: user_measurements_pkey
        update_columns: [sex, age, height_cm, waist_cm, updated_at]
      }
    ) {
      user_id
      sex
      age
      height_cm
      waist_cm
      created_at
      updated_at
    }
  }
`

export type WeightGoalInput = {
  target_weight_kg: number
  start_weight_kg: number
  goal_type: 'lose' | 'maintain' | 'gain'
  last_milestone_step?: number
}

export const GET_WEIGHT_GOAL = `
  query GetWeightGoal($userId: uuid!) {
    weight_goals_by_pk(user_id: $userId) {
      user_id
      target_weight_kg
      start_weight_kg
      goal_type
      last_milestone_step
      created_at
      updated_at
    }
  }
`

export const UPSERT_WEIGHT_GOAL = `
  mutation UpsertWeightGoal($object: weight_goals_insert_input!) {
    insert_weight_goals_one(
      object: $object
      on_conflict: {
        constraint: weight_goals_pkey
        update_columns: [
          target_weight_kg
          start_weight_kg
          goal_type
          last_milestone_step
          updated_at
        ]
      }
    ) {
      user_id
      target_weight_kg
      start_weight_kg
      goal_type
      last_milestone_step
      created_at
      updated_at
    }
  }
`

export const UPDATE_WEIGHT_GOAL = `
  mutation UpdateWeightGoal(
    $userId: uuid!
    $changes: weight_goals_set_input!
  ) {
    update_weight_goals_by_pk(
      pk_columns: { user_id: $userId }
      _set: $changes
    ) {
      user_id
      target_weight_kg
      start_weight_kg
      goal_type
      last_milestone_step
      created_at
      updated_at
    }
  }
`

export const DELETE_WEIGHT_GOAL = `
  mutation DeleteWeightGoal($userId: uuid!) {
    delete_weight_goals_by_pk(user_id: $userId) {
      user_id
    }
  }
`

export type NutritionStreakValidatedDay = {
  user_id: string
  validated_date: string
  validated_at: string
}

export type NutritionStreakRecovery = {
  user_id: string
  frozen_streak: number
  progress: number
  started_on: string
  updated_at: string
}

export const LIST_NUTRITION_STREAK_VALIDATED_DAYS = `
  query ListNutritionStreakValidatedDays($from: date!, $userId: uuid!) {
    nutrition_streak_validated_days(
      where: {
        user_id: { _eq: $userId }
        validated_date: { _gte: $from }
      }
      order_by: { validated_date: desc }
    ) {
      user_id
      validated_date
      validated_at
    }
  }
`

export const INSERT_NUTRITION_STREAK_VALIDATED_DAY = `
  mutation InsertNutritionStreakValidatedDay(
    $object: nutrition_streak_validated_days_insert_input!
  ) {
    insert_nutrition_streak_validated_days_one(
      object: $object
      on_conflict: {
        constraint: nutrition_streak_validated_days_pkey
        update_columns: []
      }
    ) {
      user_id
      validated_date
      validated_at
    }
  }
`

export const GET_NUTRITION_STREAK_RECOVERY = `
  query GetNutritionStreakRecovery($userId: uuid!) {
    nutrition_streak_recovery_by_pk(user_id: $userId) {
      user_id
      frozen_streak
      progress
      started_on
      updated_at
    }
  }
`

export const UPSERT_NUTRITION_STREAK_RECOVERY = `
  mutation UpsertNutritionStreakRecovery(
    $object: nutrition_streak_recovery_insert_input!
  ) {
    insert_nutrition_streak_recovery_one(
      object: $object
      on_conflict: {
        constraint: nutrition_streak_recovery_pkey
        update_columns: [frozen_streak, progress, started_on, updated_at]
      }
    ) {
      user_id
      frozen_streak
      progress
      started_on
      updated_at
    }
  }
`

export const UPDATE_NUTRITION_STREAK_RECOVERY = `
  mutation UpdateNutritionStreakRecovery(
    $userId: uuid!
    $changes: nutrition_streak_recovery_set_input!
  ) {
    update_nutrition_streak_recovery_by_pk(
      pk_columns: { user_id: $userId }
      _set: $changes
    ) {
      user_id
      frozen_streak
      progress
      started_on
      updated_at
    }
  }
`

export const DELETE_NUTRITION_STREAK_RECOVERY = `
  mutation DeleteNutritionStreakRecovery($userId: uuid!) {
    delete_nutrition_streak_recovery_by_pk(user_id: $userId) {
      user_id
    }
  }
`

export type WeightEntry = {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
  source: string
}

export type WeightEntryInput = {
  weight_kg: number
  logged_at?: string
  source?: string
}

export const LIST_WEIGHT_ENTRIES = `
  query ListWeightEntries($userId: uuid!) {
    weight_entries(
      where: { user_id: { _eq: $userId } }
      order_by: { logged_at: asc }
    ) {
      id
      user_id
      weight_kg
      logged_at
      source
    }
  }
`

export const INSERT_WEIGHT_ENTRY = `
  mutation InsertWeightEntry($object: weight_entries_insert_input!) {
    insert_weight_entries_one(object: $object) {
      id
      user_id
      weight_kg
      logged_at
      source
    }
  }
`

export type WaistEntry = {
  id: string
  user_id: string
  waist_cm: number
  logged_at: string
  source: string
}

export type WaistEntryInput = {
  waist_cm: number
  logged_at?: string
  source?: string
}

export const LIST_WAIST_ENTRIES = `
  query ListWaistEntries($userId: uuid!) {
    waist_entries(
      where: { user_id: { _eq: $userId } }
      order_by: { logged_at: asc }
    ) {
      id
      user_id
      waist_cm
      logged_at
      source
    }
  }
`

export const INSERT_WAIST_ENTRY = `
  mutation InsertWaistEntry($object: waist_entries_insert_input!) {
    insert_waist_entries_one(object: $object) {
      id
      user_id
      waist_cm
      logged_at
      source
    }
  }
`

export const LIST_MEAL_LOG_ENTRIES_FOR_RANGE = `
  query ListMealLogEntriesForRange($from: date!, $to: date!, $userId: uuid!) {
    meal_log_entries(
      where: {
        logged_date: { _gte: $from, _lte: $to }
        user_id: { _eq: $userId }
      }
      order_by: [{ logged_date: asc }, { created_at: asc }]
    ) {
      logged_date
      calories
    }
  }
`

export const LIST_MEAL_LOG_ENTRIES_FOR_HINTS = `
  query ListMealLogEntriesForHints($from: date!, $to: date!, $userId: uuid!) {
    meal_log_entries(
      where: {
        logged_date: { _gte: $from, _lte: $to }
        user_id: { _eq: $userId }
      }
      order_by: [{ logged_date: asc }, { created_at: asc }]
    ) {
      id
      user_id
      logged_date
      meal_type
      food_id
      custom_name
      quantity_g
      servings
      calories
      carbs_g
      protein_g
      fat_g
      food {
        serving_size_g
        salt_g
        sugar_g
        saturated_fat_g
      }
    }
  }
`

export const LIST_MEAL_LOG_ENTRIES_FOR_DATE = `
  query ListMealLogEntriesForDate($date: date!, $userId: uuid!) {
    meal_log_entries(
      where: { logged_date: { _eq: $date }, user_id: { _eq: $userId } }
      order_by: [{ meal_type: asc }, { created_at: asc }]
    ) {
      id
      user_id
      logged_date
      meal_type
      food_id
      custom_name
      quantity_g
      servings
      calories
      carbs_g
      protein_g
      fat_g
      created_at
      updated_at
      food {
        id
        user_id
        barcode
        name
        brand
        calories
        carbs_g
        protein_g
        fat_g
        salt_g
        sugar_g
        saturated_fat_g
        serving_size_g
        serving_label
        source
        off_product_id
        created_at
        updated_at
      }
    }
  }
`

export const INSERT_MEAL_LOG_ENTRY = `
  mutation InsertMealLogEntry($object: meal_log_entries_insert_input!) {
    insert_meal_log_entries_one(object: $object) {
      id
      logged_date
      meal_type
      food_id
      custom_name
      quantity_g
      servings
      calories
      carbs_g
      protein_g
      fat_g
      created_at
      updated_at
      food {
        id
        name
        brand
        calories
        carbs_g
        protein_g
        fat_g
        serving_size_g
        serving_label
        source
        off_product_id
      }
    }
  }
`

export const UPDATE_MEAL_LOG_ENTRY = `
  mutation UpdateMealLogEntry($id: uuid!, $changes: meal_log_entries_set_input!) {
    update_meal_log_entries_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      logged_date
      meal_type
      food_id
      custom_name
      quantity_g
      servings
      calories
      carbs_g
      protein_g
      fat_g
      updated_at
      food {
        id
        name
        brand
        calories
        carbs_g
        protein_g
        fat_g
        serving_size_g
        serving_label
      }
    }
  }
`

export const DELETE_MEAL_LOG_ENTRY = `
  mutation DeleteMealLogEntry($id: uuid!) {
    delete_meal_log_entries_by_pk(id: $id) {
      id
    }
  }
`

export const FOOD_SEARCH_FIELDS = `
      id
      user_id
      barcode
      name
      brand
      calories
      carbs_g
      protein_g
      fat_g
      salt_g
      sugar_g
      saturated_fat_g
      serving_size_g
      serving_label
      source
      off_product_id
      ciqual_code
      created_at
      updated_at
`

const FOOD_TEXT_MATCH = (variable: string) => `{ search_text: { _ilike: ${variable} } }`

export const SEARCH_USER_FOODS = `
  query SearchUserFoods($userId: uuid!, $pattern: String!, $limit: Int = 10) {
    foods(
      where: {
        _and: [
          { user_id: { _eq: $userId } }
          ${FOOD_TEXT_MATCH('$pattern')}
        ]
      }
      order_by: [{ name: asc }]
      limit: $limit
    ) {
${FOOD_SEARCH_FIELDS}
    }
  }
`

export const SEARCH_CIQUAL_FOODS = `
  query SearchCiqualFoods($namePrefix: String!, $containsPattern: String!, $limit: Int = 3) {
    foods(
      where: {
        _and: [
          { source: { _eq: ciqual } }
          {
            _or: [
              { search_text: { _ilike: $namePrefix } }
              { search_text: { _ilike: $containsPattern } }
            ]
          }
        ]
      }
      order_by: [{ name: asc }]
      limit: $limit
    ) {
${FOOD_SEARCH_FIELDS}
    }
  }
`

export const SEARCH_OFF_CATALOG_FOODS = `
  query SearchOffCatalogFoods($pattern: String!, $limit: Int = 10) {
    foods(
      where: {
        _and: [
          { source: { _eq: open_food_facts } }
          ${FOOD_TEXT_MATCH('$pattern')}
        ]
      }
      order_by: [{ name: asc }]
      limit: $limit
    ) {
${FOOD_SEARCH_FIELDS}
    }
  }
`

export const SEARCH_CATALOG_FOODS = `
  query SearchCatalogFoods($pattern: String!, $limit: Int = 20) {
    foods(
      where: {
        _and: [
          { source: { _in: [open_food_facts, ciqual] } }
          ${FOOD_TEXT_MATCH('$pattern')}
        ]
      }
      order_by: [{ source: asc }, { name: asc }]
      limit: $limit
    ) {
${FOOD_SEARCH_FIELDS}
    }
  }
`

/** @deprecated Use SEARCH_CATALOG_FOODS */
export const SEARCH_OFF_FOODS = SEARCH_CATALOG_FOODS

/** @deprecated Use SEARCH_USER_FOODS + SEARCH_OFF_FOODS */
export const SEARCH_MY_FOODS = `
  query SearchMyFoods($query: String!, $limit: Int = 20) {
    foods(
      where: {
        _and: [
          {
            _or: [
              { user_id: { _is_null: false } }
              { source: { _in: [open_food_facts, ciqual] } }
            ]
          }
          {
            _or: [
              { name: { _ilike: $query } }
              { brand: { _ilike: $query } }
              { barcode: { _ilike: $query } }
            ]
          }
        ]
      }
      order_by: [{ source: asc }, { name: asc }]
      limit: $limit
    ) {
      id
      user_id
      barcode
      name
      brand
      calories
      carbs_g
      protein_g
      fat_g
      salt_g
      sugar_g
      saturated_fat_g
      serving_size_g
      serving_label
      source
      off_product_id
      created_at
      updated_at
    }
  }
`

export const INSERT_FOOD = `
  mutation InsertFood($object: foods_insert_input!) {
    insert_foods_one(object: $object) {
      id
      user_id
      barcode
      name
      brand
      calories
      carbs_g
      protein_g
      fat_g
      salt_g
      sugar_g
      saturated_fat_g
      serving_size_g
      serving_label
      source
      off_product_id
      created_at
      updated_at
    }
  }
`

export const GET_FOOD_BY_OFF_ID = `
  query GetFoodByOffId($offProductId: String!) {
    foods(where: { off_product_id: { _eq: $offProductId } }, limit: 1) {
      id
      user_id
      barcode
      name
      brand
      calories
      carbs_g
      protein_g
      fat_g
      salt_g
      sugar_g
      saturated_fat_g
      serving_size_g
      serving_label
      source
      off_product_id
      created_at
      updated_at
    }
  }
`

export const GET_FOOD_BY_BARCODE = `
  query GetFoodByBarcode($barcode: String!) {
    foods(where: { barcode: { _eq: $barcode } }, limit: 1) {
      id
      user_id
      barcode
      name
      brand
      calories
      carbs_g
      protein_g
      fat_g
      salt_g
      sugar_g
      saturated_fat_g
      serving_size_g
      serving_label
      source
      off_product_id
      created_at
      updated_at
    }
  }
`

export const LIST_FOOD_FAVORITES = `
  query ListFoodFavorites {
    food_favorites(order_by: { created_at: desc }) {
      id
      food_id
      created_at
      food {
        id
        name
        brand
        calories
        carbs_g
        protein_g
        fat_g
        serving_size_g
        serving_label
        source
        off_product_id
      }
    }
  }
`

export const INSERT_FOOD_FAVORITE = `
  mutation InsertFoodFavorite($foodId: uuid!) {
    insert_food_favorites_one(object: { food_id: $foodId }) {
      id
      food_id
      created_at
    }
  }
`

export const DELETE_FOOD_FAVORITE = `
  mutation DeleteFoodFavorite($id: uuid!) {
    delete_food_favorites_by_pk(id: $id) {
      id
    }
  }
`

export const LIST_FREQUENT_FOODS = `
  query ListFrequentFoods($since: date!, $userId: uuid!) {
    meal_log_entries(
      where: { logged_date: { _gte: $since }, user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 200
    ) {
      food_id
      quantity_g
      servings
      food {
        id
        name
        brand
        calories
        carbs_g
        protein_g
        fat_g
        serving_size_g
        serving_label
        source
        off_product_id
      }
    }
  }
`

export const INSERT_FOOD_RENAME_PROPOSAL = `
  mutation InsertFoodRenameProposal($foodId: uuid!, $proposedName: String!) {
    insert_food_rename_proposals_one(
      object: { food_id: $foodId, proposed_name: $proposedName }
    ) {
      id
      food_id
      proposed_name
      status
      created_at
    }
  }
`

export const LIST_PENDING_FOOD_RENAME_PROPOSALS = `
  query ListPendingFoodRenameProposals {
    food_rename_proposals(
      where: { status: { _eq: pending } }
      order_by: { created_at: asc }
    ) {
      id
      proposed_name
      created_at
      food {
        id
        name
        brand
        source
      }
      proposer {
        id
        display_name
      }
    }
  }
`

export const REVIEW_FOOD_RENAME_PROPOSAL = `
  mutation ReviewFoodRenameProposal($id: uuid!, $status: food_rename_proposal_status!) {
    update_food_rename_proposals_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
      reviewed_at
      food {
        id
        name
      }
    }
  }
`

export const INSERT_FOOD_PORTION_TYPE = `
  mutation InsertFoodPortionType(
    $foodId: uuid!
    $portionName: String!
    $portionSizeG: numeric!
  ) {
    insert_food_portion_types_one(
      object: {
        food_id: $foodId
        portion_name: $portionName
        portion_size_g: $portionSizeG
      }
    ) {
      id
      food_id
      portion_name
      portion_size_g
      created_at
    }
  }
`

export const LIST_FOOD_PORTION_TYPES = `
  query ListFoodPortionTypes($foodId: uuid!) {
    food_portion_types(
      where: { food_id: { _eq: $foodId } }
      order_by: { created_at: desc }
    ) {
      id
      portion_name
      portion_size_g
      created_at
    }
  }
`

export const SEARCH_PROFILE_BY_FRIEND_CODE = `
  query SearchProfileByFriendCode($code: String!) {
    profiles(where: { friend_code: { _eq: $code } }, limit: 1) {
      id
      display_name
      avatar_url
      friend_code
    }
  }
`

export const SEARCH_PROFILE_BY_EMAIL = `
  query SearchProfileByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      display_name
      avatar_url
      friend_code
    }
  }
`

export const LIST_MY_FRIENDSHIPS = `
  query ListMyFriendships {
    friendships(order_by: { created_at: desc }) {
      id
      requester_id
      addressee_id
      invited_email
      status
      created_at
      requester {
        id
        display_name
        avatar_url
        friend_code
        is_premium
      }
      addressee {
        id
        display_name
        avatar_url
        friend_code
        is_premium
      }
    }
  }
`

export const LIST_ACCEPTED_FRIENDS_ACTIVITY = `
  query ListAcceptedFriendsActivity($mealSince: date!, $workoutSince: timestamptz!) {
    friendships(
      where: { status: { _eq: accepted } }
      order_by: { created_at: asc }
    ) {
      id
      requester_id
      addressee_id
      status
      requester {
        id
        display_name
        avatar_url
        is_premium
        workouts(
          where: {
            ended_at: { _is_null: false }
            started_at: { _gte: $workoutSince }
          }
          order_by: { started_at: desc }
        ) {
          started_at
        }
        meal_log_entries(
          where: { logged_date: { _gte: $mealSince } }
          order_by: { logged_date: desc }
        ) {
          logged_date
          calories
        }
      }
      addressee {
        id
        display_name
        avatar_url
        is_premium
        workouts(
          where: {
            ended_at: { _is_null: false }
            started_at: { _gte: $workoutSince }
          }
          order_by: { started_at: desc }
        ) {
          started_at
        }
        meal_log_entries(
          where: { logged_date: { _gte: $mealSince } }
          order_by: { logged_date: desc }
        ) {
          logged_date
          calories
        }
      }
    }
  }
`

export const INSERT_FRIENDSHIP = `
  mutation InsertFriendship($object: friendships_insert_input!) {
    insert_friendships_one(object: $object) {
      id
      requester_id
      addressee_id
      invited_email
      status
      created_at
    }
  }
`

export const UPDATE_FRIENDSHIP_STATUS = `
  mutation UpdateFriendshipStatus($id: uuid!, $status: String!) {
    update_friendships_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
      addressee_id
    }
  }
`

export const DELETE_FRIENDSHIP = `
  mutation DeleteFriendship($id: uuid!) {
    delete_friendships_by_pk(id: $id) {
      id
    }
  }
`

export const INSERT_FRIEND_MOTIVATION = `
  mutation InsertFriendMotivation($object: friend_motivations_insert_input!) {
    insert_friend_motivations_one(object: $object) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      created_at
    }
  }
`

export const COUNT_UNREAD_MOTIVATIONS = `
  query CountMotivationNotifications($userId: uuid!) {
    incoming: friend_motivations_aggregate(
      where: {
        recipient_id: { _eq: $userId }
        read_at: { _is_null: true }
      }
    ) {
      aggregate {
        count
      }
    }
    heartReplies: friend_motivations_aggregate(
      where: {
        sender_id: { _eq: $userId }
        hearted_at: { _is_null: false }
        sender_reply_seen_at: { _is_null: true }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`

export const LIST_MY_SENT_MOTIVATIONS = `
  query ListMySentMotivations($userId: uuid!) {
    friend_motivations(
      where: { sender_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      read_at
      hearted_at
      reply_message
      sender_reply_seen_at
      created_at
    }
  }
`

export const LIST_MY_SENT_MOTIVATIONS_LEGACY = `
  query ListMySentMotivationsLegacy($userId: uuid!) {
    friend_motivations(
      where: { sender_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      read_at
      hearted_at
      reply_message
      created_at
    }
  }
`

export const LIST_UNSEEN_HEART_REPLIES = `
  query ListUnseenHeartReplies($userId: uuid!) {
    friend_motivations(
      where: {
        sender_id: { _eq: $userId }
        hearted_at: { _is_null: false }
        sender_reply_seen_at: { _is_null: true }
      }
      order_by: { hearted_at: desc }
    ) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      read_at
      hearted_at
      reply_message
      sender_reply_seen_at
      created_at
      recipient {
        id
        display_name
        avatar_url
      }
    }
  }
`

export const LIST_UNREAD_MOTIVATIONS = `
  query ListUnreadMotivations($userId: uuid!) {
    friend_motivations(
      where: {
        recipient_id: { _eq: $userId }
        read_at: { _is_null: true }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      read_at
      hearted_at
      reply_message
      sender_reply_seen_at
      created_at
      sender {
        id
        display_name
        avatar_url
        is_premium
      }
    }
  }
`

export const LIST_UNREAD_MOTIVATIONS_LEGACY = `
  query ListUnreadMotivationsLegacy($userId: uuid!) {
    friend_motivations(
      where: {
        recipient_id: { _eq: $userId }
        read_at: { _is_null: true }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      recipient_id
      emoji
      message
      preset_key
      read_at
      hearted_at
      reply_message
      sender_reply_seen_at
      created_at
    }
  }
`

export const MARK_MOTIVATION_REPLY_SEEN = `
  mutation MarkMotivationReplySeen($id: uuid!, $seenAt: timestamptz!) {
    update_friend_motivations_by_pk(
      pk_columns: { id: $id }
      _set: { sender_reply_seen_at: $seenAt }
    ) {
      id
      sender_reply_seen_at
    }
  }
`

export const MARK_MOTIVATION_READ = `
  mutation MarkMotivationRead($id: uuid!, $readAt: timestamptz!) {
    update_friend_motivations_by_pk(
      pk_columns: { id: $id }
      _set: { read_at: $readAt }
    ) {
      id
      read_at
    }
  }
`

export const REPLY_FRIEND_MOTIVATION = `
  mutation ReplyFriendMotivation(
    $id: uuid!
    $readAt: timestamptz!
    $heartedAt: timestamptz!
    $replyMessage: String
  ) {
    update_friend_motivations_by_pk(
      pk_columns: { id: $id }
      _set: {
        read_at: $readAt
        hearted_at: $heartedAt
        reply_message: $replyMessage
      }
    ) {
      id
      read_at
      hearted_at
      reply_message
    }
  }
`

export const START_MY_PREMIUM_TRIAL = `
  mutation StartMyPremiumTrial($billingPeriod: String!) {
    start_my_premium_trial(args: { p_billing_period: $billingPeriod }) {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const CANCEL_MY_SUBSCRIPTION = `
  mutation CancelMySubscription {
    cancel_my_subscription {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const RECONCILE_MY_SUBSCRIPTION = `
  query ReconcileMySubscription {
    reconcile_my_subscription {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const GET_MY_SUBSCRIPTION = `
  query GetMySubscription($userId: uuid!) {
    subscriptions(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const UPDATE_MY_SUBSCRIPTION = `
  mutation UpdateMySubscription($id: uuid!, $changes: subscriptions_set_input!) {
    update_subscriptions_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const INSERT_MY_SUBSCRIPTION = `
  mutation InsertMySubscription($object: subscriptions_insert_input!) {
    insert_subscriptions_one(object: $object) {
      id
      user_id
      tier
      status
      billing_period
      current_period_end
      provider
      provider_ref
      trial_consumed_at
      created_at
      updated_at
    }
  }
`

export const INSERT_CANCELLATION_FEEDBACK = `
  mutation InsertCancellationFeedback($object: subscription_cancellation_feedback_insert_input!) {
    insert_subscription_cancellation_feedback_one(object: $object) {
      id
    }
  }
`

export const ADMIN_PLATFORM_METRICS = `
  query AdminPlatformMetrics($from: date!, $to: date!, $cohortWeeks: Int!) {
    admin_platform_metrics(
      args: { p_from: $from, p_to: $to, p_cohort_weeks: $cohortWeeks }
    ) {
      value
    }
  }
`

export const ADMIN_PLATFORM_RECENT_LISTS = `
  query AdminPlatformRecentLists($limit: Int!) {
    admin_platform_recent_lists(args: { p_limit: $limit }) {
      value
    }
  }
`

export const ADMIN_SUPPORT_REQUESTS = `
  query AdminSupportRequests($limit: Int!) {
    admin_support_requests(args: { p_limit: $limit }) {
      value
    }
  }
`

export const INSERT_SUPPORT_REQUEST = `
  mutation InsertSupportRequest($object: support_requests_insert_input!) {
    insert_support_requests_one(object: $object) {
      id
    }
  }
`

export const GET_FRIEND_PROFILE_SUMMARY = `
  query GetFriendProfileSummary(
    $friendId: uuid!
    $workoutLimit: Int!
    $workoutSince: timestamptz!
  ) {
    profiles_by_pk(id: $friendId) {
      id
      display_name
      avatar_url
      is_premium
      user_badges(order_by: { unlocked_at: desc }) {
        id
        user_id
        badge_key
        unlocked_at
      }
      workouts(
        where: {
          ended_at: { _is_null: false }
          started_at: { _gte: $workoutSince }
        }
        order_by: { started_at: desc }
        limit: $workoutLimit
      ) {
        id
        title
        started_at
        ended_at
        share_token
        workout_exercises(order_by: { sort_order: asc }) {
          id
          exercise {
            id
            name
            name_fr
            muscle_group
            equipment
          }
          sets(order_by: { set_index: asc }) {
            set_index
            weight_kg
            reps
            set_type
            rpe
          }
        }
      }
    }
  }
`

export const GET_FRIEND_PROFILE = `
  query GetFriendProfile(
    $friendId: uuid!
    $workoutLimit: Int!
    $mealSince: date!
    $workoutSince: timestamptz!
  ) {
    profiles_by_pk(id: $friendId) {
      id
      display_name
      avatar_url
      is_premium
      user_badges(order_by: { unlocked_at: desc }) {
        id
        user_id
        badge_key
        unlocked_at
      }
      workouts(
        where: {
          ended_at: { _is_null: false }
          started_at: { _gte: $workoutSince }
        }
        order_by: { started_at: desc }
        limit: $workoutLimit
      ) {
        id
        title
        started_at
        ended_at
        share_token
        workout_exercises(order_by: { sort_order: asc }) {
          id
          exercise {
            id
            name
            name_fr
            muscle_group
            equipment
          }
          sets(order_by: { set_index: asc }) {
            set_index
            weight_kg
            reps
            set_type
            rpe
          }
        }
      }
      meal_log_entries(
        where: { logged_date: { _gte: $mealSince } }
        order_by: { logged_date: desc }
      ) {
        logged_date
        calories
      }
    }
  }
`

export const LIST_MY_BADGES = `
  query ListMyBadges($userId: uuid!) {
    user_badges(
      where: { user_id: { _eq: $userId } }
      order_by: { unlocked_at: desc } 
    ) {
      id
      user_id
      badge_key
      unlocked_at
    }
  }
`

export const LIST_ACTIVE_BADGE_DEFINITIONS = `
  query ListActiveBadgeDefinitions {
    badge_definitions(
      where: { is_active: { _eq: true } }
      order_by: [{ sort_order: asc }, { key: asc }]
    ) {
      key
      label
      description
      category
      tier
      icon_name
      rule_type
      rule_threshold
      is_active
      sort_order
      unlock_count
      unlock_percent
      created_at
      updated_at
    }
  }
`

export const LIST_ALL_BADGE_DEFINITIONS = `
  query ListAllBadgeDefinitions {
    badge_definitions(order_by: [{ sort_order: asc }, { key: asc }]) {
      key
      label
      description
      category
      tier
      icon_name
      rule_type
      rule_threshold
      is_active
      sort_order
      unlock_count
      unlock_percent
      created_at
      updated_at
    }
  }
`

export const INSERT_BADGE_DEFINITION = `
  mutation InsertBadgeDefinition($object: badge_definitions_insert_input!) {
    insert_badge_definitions_one(object: $object) {
      key
      label
      description
      category
      tier
      icon_name
      rule_type
      rule_threshold
      is_active
      sort_order
      unlock_count
      unlock_percent
      created_at
      updated_at
    }
  }
`

export const UPDATE_BADGE_DEFINITION = `
  mutation UpdateBadgeDefinition(
    $key: String!
    $changes: badge_definitions_set_input!
  ) {
    update_badge_definitions_by_pk(pk_columns: { key: $key }, _set: $changes) {
      key
      label
      description
      category
      tier
      icon_name
      rule_type
      rule_threshold
      is_active
      sort_order
      unlock_count
      unlock_percent
      created_at
      updated_at
    }
  }
`

export const DELETE_BADGE_DEFINITION = `
  mutation DeleteBadgeDefinition($key: String!) {
    delete_badge_definitions_by_pk(key: $key) {
      key
    }
  }
`

export const INSERT_USER_BADGE = `
  mutation InsertUserBadge($badgeKey: String!) {
    insert_user_badges_one(
      object: { badge_key: $badgeKey }
      on_conflict: {
        constraint: user_badges_user_id_badge_key_key
        update_columns: []
      }
    ) {
      id
      user_id
      badge_key
      unlocked_at
    }
  }
`
