import type { PluginListenerHandle } from '@capacitor/core'

export type WorkoutSnapshotPayload = Record<string, unknown>

export type WearWatchStatus = {
  available: boolean
  paired: boolean
  hasRcoachWear: boolean
}

export type PromptWearAppInstallResult = {
  launched: boolean
  reason?: string
}

export interface WearBridgePlugin {
  isWatchAvailable(): Promise<WearWatchStatus>
  publishSnapshot(options: { snapshotJson: string }): Promise<void>
  launchWearApp(): Promise<void>
  promptWearAppInstall(): Promise<PromptWearAppInstallResult>
  addListener(
    eventName: 'watchCommand',
    listenerFunc: (event: { commandJson: string }) => void,
  ): Promise<PluginListenerHandle>
}
