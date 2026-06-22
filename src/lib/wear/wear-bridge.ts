import { Capacitor } from '@capacitor/core'

import type { WorkoutSnapshot, WatchCommand } from '@/lib/wear/workout-sync-protocol'
import {
  decodeWatchCommand,
  encodeWorkoutSnapshot,
} from '@/lib/wear/workout-sync-protocol'

type WearBridgeLike = {
  isWatchAvailable(): Promise<{ available: boolean }>
  publishSnapshot(options: { snapshotJson: string }): Promise<void>
  addListener(
    eventName: 'watchCommand',
    listenerFunc: (event: { commandJson: string }) => void,
  ): Promise<{ remove: () => Promise<void> }>
}

let cachedBridge: WearBridgeLike | null | undefined

async function loadWearBridge(): Promise<WearBridgeLike | null> {
  if (cachedBridge !== undefined) {
    return cachedBridge
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    cachedBridge = null
    return cachedBridge
  }

  try {
    const module = await import('@rcoach/capacitor-wear-bridge')
    cachedBridge = module.WearBridge as WearBridgeLike
  } catch {
    cachedBridge = null
  }

  return cachedBridge
}

export async function isWearBridgeSupported() {
  const bridge = await loadWearBridge()
  if (!bridge) {
    return false
  }

  try {
    const result = await bridge.isWatchAvailable()
    return result.available
  } catch {
    return false
  }
}

export async function publishWorkoutSnapshot(snapshot: WorkoutSnapshot) {
  const bridge = await loadWearBridge()
  if (!bridge) {
    return
  }

  await bridge.publishSnapshot({
    snapshotJson: encodeWorkoutSnapshot(snapshot),
  })
}

export async function subscribeToWatchCommands(
  handler: (command: WatchCommand) => void,
) {
  const bridge = await loadWearBridge()
  if (!bridge) {
    return () => undefined
  }

  const listener = await bridge.addListener('watchCommand', (event) => {
    handler(decodeWatchCommand(event.commandJson))
  })

  return () => {
    void listener.remove()
  }
}
