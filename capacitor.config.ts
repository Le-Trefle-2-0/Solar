import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.letrefle.solar',
  appName: 'Le Trefle 2.0',
  webDir: 'public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
