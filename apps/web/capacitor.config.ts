import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'org.letrefle.solar',
    appName: 'Solar',
    webDir: 'public',
    server: {
        url: "http://localhost:3000",
        cleartext: true,
    }
};

export default config;
