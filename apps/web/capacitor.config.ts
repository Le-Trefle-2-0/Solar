import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'org.letrefle.solar',
    appName: 'Solar',
    webDir: 'public',
    server: {
        url: "https://beta.letrefle.org",
        cleartext: false,
    }
};

export default config;
