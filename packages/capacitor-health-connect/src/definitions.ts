export type HealthConnectAvailability =
  | 'Available'
  | 'NotInstalled'
  | 'NotSupported'

export type ExerciseType = 'STRENGTH_TRAINING'

export interface WriteExerciseSessionOptions {
  clientRecordId: string
  title: string
  startTime: string
  endTime: string
  exerciseType?: ExerciseType
}

export interface ReadHeartRateSummaryOptions {
  startTime: string
  endTime: string
}

export interface HeartRateSummary {
  avgBpm?: number
  maxBpm?: number
  sampleCount: number
}

export interface HealthConnectPlugin {
  isAvailable(): Promise<{ status: HealthConnectAvailability }>
  getPermissionStatus(): Promise<{ granted: boolean }>
  requestHealthPermissions(): Promise<{ granted: boolean }>
  writeExerciseSession(options: WriteExerciseSessionOptions): Promise<void>
  readHeartRateSummary(options: ReadHeartRateSummaryOptions): Promise<HeartRateSummary>
  openHealthConnectSettings(): Promise<void>
}
