import type { PluginListenerHandle } from '@capacitor/core'

export type WorkoutSnapshotPayload = Record<string, unknown>

export type WearWatchStatus = {
  available: boolean
  paired: boolean
  hasRcoachWear: boolean
}

export interface WearBridgePlugin {
  isWatchAvailable(): Promise<WearWatchStatus>
  publishSnapshot(options: { snapshotJson: string }): Promise<void>
  launchWearApp(): Promise<void>
  addListener(
    eventName: 'watchCommand',
    listenerFunc: (event: { commandJson: string }) => void,
  ): Promise<PluginListenerHandle>
}
