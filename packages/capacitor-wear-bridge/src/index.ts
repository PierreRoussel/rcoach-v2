import { registerPlugin } from '@capacitor/core'

import type { WearBridgePlugin } from './definitions'

export * from './definitions'

export const WearBridge = registerPlugin<WearBridgePlugin>('WearBridge', {
  web: () => import('./web').then((module) => new module.WearBridgeWeb()),
})
