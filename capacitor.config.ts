import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ruzzaorologi.watchapp',
  appName: 'Ruzza Watch',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
