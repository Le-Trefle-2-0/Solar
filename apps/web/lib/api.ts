export function getWebBase() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return (process.env.INTERNAL_AUTH_URL || process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getApiBase() {
    if (typeof window !== 'undefined') {
        const url = (process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(':3000', ':3001')).replace(/\/$/, '');
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.warn(`NEXT_PUBLIC_API_URL is not set, falling back to ${url}`);
        }
        return url;
    }
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

let cachedJwt: string | null = null;

export async function getJwt(): Promise<string | null> {
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

export function clearJwtCache() {
    cachedJwt = null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
    const base = getApiBase();
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    let jwt = await getJwt();
    const headers = new Headers(init.headers as any);
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    let res = await fetch(url, {...init, headers, credentials: 'include'});

    // If 401, maybe the JWT is stale, try clearing cache and retrying once
    if (res.status === 401) {
        clearJwtCache();
        const newJwt = await getJwt();
        if (newJwt && newJwt !== jwt) {
            headers.set('Authorization', `Bearer ${newJwt}`);
            res = await fetch(url, {...init, headers, credentials: 'include'});
        }
    }

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
