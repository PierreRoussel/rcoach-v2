import { WebPlugin } from '@capacitor/core'

import type { WearBridgePlugin } from './definitions'

export class WearBridgeWeb extends WebPlugin implements WearBridgePlugin {
  async isWatchAvailable() {
    return { available: false }
  }

  async publishSnapshot() {
    return
  }
}
