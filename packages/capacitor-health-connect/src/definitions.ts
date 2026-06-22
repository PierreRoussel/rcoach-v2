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

export interface HealthConnectPlugin {
  isAvailable(): Promise<{ status: HealthConnectAvailability }>
  getPermissionStatus(): Promise<{ granted: boolean }>
  requestHealthPermissions(): Promise<{ granted: boolean }>
  writeExerciseSession(options: WriteExerciseSessionOptions): Promise<void>
  openHealthConnectSettings(): Promise<void>
}
