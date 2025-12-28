import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'org.letrefle.solar',
    appName: 'Solar',
    webDir: 'out',
    server: {
        androidScheme: 'https',
    }
};

export default config;
