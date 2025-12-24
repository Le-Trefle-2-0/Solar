export function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

let cachedJwt: string | null = null;

export async function getJwt(): Promise<string | null> {
    if (cachedJwt) return cachedJwt;
    try {
        // We still obtain the JWT from Better Auth in the web app
        const res = await fetch('/api/auth/token', {cache: 'no-store'});
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
