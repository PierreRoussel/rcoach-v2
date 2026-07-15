import { Capacitor, registerPlugin } from '@capacitor/core'

import type { WearBridgePlugin } from '@rcoach/capacitor-wear-bridge'
import type { WearWatchStatus } from '../../../packages/capacitor-wear-bridge/src/definitions'
import type { WorkoutSnapshot, WatchCommand } from '@/lib/wear/workout-sync-protocol'
import {
  decodeWatchCommand,
  encodeWorkoutSnapshot,
} from '@/lib/wear/workout-sync-protocol'

export type { WearWatchStatus }

const NO_WATCH_STATUS: WearWatchStatus = {
  available: false,
  paired: false,
  hasRcoachWear: false,
}

let cachedBridge: WearBridgePlugin | null | undefined

function loadWearBridge(): WearBridgePlugin | null {
  if (cachedBridge !== undefined) {
    return cachedBridge
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    cachedBridge = null
    return cachedBridge
  }

  cachedBridge = registerPlugin<WearBridgePlugin>('WearBridge', {
    web: () =>
      import('../../../packages/capacitor-wear-bridge/src/web').then(
        (module) => new module.WearBridgeWeb(),
      ),
  })
  return cachedBridge
}

export async function getWearWatchStatus(): Promise<WearWatchStatus> {
  const bridge = loadWearBridge()
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
  const bridge = loadWearBridge()
  if (!bridge) {
    return
  }

  await bridge.publishSnapshot({
    snapshotJson: encodeWorkoutSnapshot(snapshot),
  })
}

export async function launchWearWorkoutApp() {
  const bridge = loadWearBridge()
  if (!bridge) {
    return
  }

  try {
    await bridge.launchWearApp()
  } catch {
    // Montre non joignable — le snapshot Data Layer ouvrira l'app en secours.
  }
}

export async function subscribeToWatchCommands(
  handler: (command: WatchCommand) => void,
) {
  const bridge = loadWearBridge()
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
    return 'Montre appairée — lancez RCoach Montre une fois'
  }

  return 'Montre non appairée (app Wear OS)'
}
