import { Capacitor } from '@capacitor/core'

import type { WearWatchStatus } from '@rcoach/capacitor-wear-bridge'
import type { WorkoutSnapshot, WatchCommand } from '@/lib/wear/workout-sync-protocol'
import {
  decodeWatchCommand,
  encodeWorkoutSnapshot,
} from '@/lib/wear/workout-sync-protocol'

export type { WearWatchStatus }

type WearBridgeLike = {
  isWatchAvailable(): Promise<WearWatchStatus>
  publishSnapshot(options: { snapshotJson: string }): Promise<void>
  addListener(
    eventName: 'watchCommand',
    listenerFunc: (event: { commandJson: string }) => void,
  ): Promise<{ remove: () => Promise<void> }>
}

const NO_WATCH_STATUS: WearWatchStatus = {
  available: false,
  paired: false,
  hasRcoachWear: false,
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

export async function getWearWatchStatus(): Promise<WearWatchStatus> {
  const bridge = await loadWearBridge()
  if (!bridge) {
    return NO_WATCH_STATUS
  }

  try {
    return await bridge.isWatchAvailable()
  } catch {
    return NO_WATCH_STATUS
  }
}

export async function isWearBridgeSupported() {
  const status = await getWearWatchStatus()
  return status.available
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

export function formatWearWatchStatusLabel(status: WearWatchStatus) {
  if (status.hasRcoachWear || status.available) {
    return 'Montre Wear OS connectée'
  }

  if (status.paired) {
    return 'Montre appairée — ouvrez RCoach sur la montre'
  }

  return 'Montre non appairée (app Wear OS)'
}
