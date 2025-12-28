let config: any = null;

async function loadConfig() {
    if (config) return config;
    if (typeof window === 'undefined') return {};
    try {
        const res = await fetch('/config.json');
        config = await res.json();
        return config;
    } catch (e) {
        console.error('Failed to load config.json', e);
        return {};
    }
}

export function getWebBase() {
    if (config?.appBase) return config.appBase;
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getApiBase() {
    if (config?.apiBase) return config.apiBase;
    if (typeof window !== 'undefined') {
        const url = (process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(':3000', ':4000')).replace(/\/$/, '');
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.warn(`NEXT_PUBLIC_API_URL is not set, falling back to ${url}`);
        }
        return url;
    }
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
}

export function getWsBase() {
    if (config?.wsBase) return config.wsBase;
    return (process.env.NEXT_PUBLIC_WS_URL || getApiBase().replace(/^http/, 'ws').replace(':4000', ':5000')).replace(/\/$/, '');
}

export function getStorageBase() {
    if (config?.storageBase) return config.storageBase;
    return (process.env.NEXT_PUBLIC_STORAGE_URL || getApiBase().replace(':4000', ':6000')).replace(/\/$/, '');
}

export function getVoiceBase() {
    if (config?.voiceBase) return config.voiceBase;
    return (process.env.NEXT_PUBLIC_VOICE_URL || getApiBase().replace(':4000', ':7000')).replace(/\/$/, '');
}

let cachedJwt: string | null = null;

export async function getJwt(): Promise<string | null> {
    await loadConfig();
    if (cachedJwt) return cachedJwt;
    try {
        const base = getWebBase();
        // We still obtain the JWT from Better Auth in the web app
        const res = await fetch(`${base}/api/auth/token`, {
            cache: 'no-store',
            credentials: 'include',
            headers: typeof window === 'undefined' ? {
                'Cookie': (await import('next/headers')).cookies().toString()
            } : {}
        });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        const data = await res.json();
        cachedJwt = data?.token || null;
        return cachedJwt;
    } catch {
        return null;
    }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
    await loadConfig();
    const base = getApiBase();
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    const jwt = await getJwt();
    const headers = new Headers(init.headers as any);
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url, {...init, headers, credentials: 'include'});
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
        // Return raw text for debugging if needed
        const txt = await res.text();
        throw new Error(`API responded with non-JSON (${res.status}): ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!res.ok) {
        let msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }
        throw new Error(msg);
    }
    return data;
}
