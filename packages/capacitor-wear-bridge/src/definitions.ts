import type { PluginListenerHandle } from '@capacitor/core'

export type WorkoutSnapshotPayload = Record<string, unknown>

export interface WearBridgePlugin {
  isWatchAvailable(): Promise<{ available: boolean }>
  publishSnapshot(options: { snapshotJson: string }): Promise<void>
  addListener(
    eventName: 'watchCommand',
    listenerFunc: (event: { commandJson: string }) => void,
  ): Promise<PluginListenerHandle>
}
