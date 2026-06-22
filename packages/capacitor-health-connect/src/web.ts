import { WebPlugin } from '@capacitor/core'

import type {
  HealthConnectAvailability,
  HealthConnectPlugin,
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

  async openHealthConnectSettings(): Promise<void> {
    return
  }
}
