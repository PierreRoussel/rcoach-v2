import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.rcoach.app',
  appName: 'RCoach',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
