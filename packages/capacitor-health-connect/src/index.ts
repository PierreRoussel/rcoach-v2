import { registerPlugin } from '@capacitor/core'

import type { HealthConnectPlugin } from './definitions'

export * from './definitions'

export const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect', {
  web: () => import('./web').then((module) => new module.HealthConnectWeb()),
})
