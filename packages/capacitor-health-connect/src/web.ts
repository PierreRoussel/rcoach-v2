import { WebPlugin } from '@capacitor/core'

import type {
  HealthConnectAvailability,
  HealthConnectPlugin,
  HeartRateSummary,
  ReadHeartRateSummaryOptions,
  WriteExerciseSessionOptions,
} from './definitions'

export class HealthConnectWeb extends WebPlugin implements HealthConnectPlugin {
  async isAvailable(): Promise<{ status: HealthConnectAvailability }> {
    return { status: 'NotSupported' }
  }

  async getPermissionStatus(): Promise<{ granted: boolean }> {
    return { granted: false }
  }

  async requestHealthPermissions(): Promise<{ granted: boolean }> {
    return { granted: false }
  }

  async writeExerciseSession(_options: WriteExerciseSessionOptions): Promise<void> {
    return
  }

  async readHeartRateSummary(
    _options: ReadHeartRateSummaryOptions,
  ): Promise<HeartRateSummary> {
    return { sampleCount: 0 }
  }

  async openHealthConnectSettings(): Promise<void> {
    return
  }
}
