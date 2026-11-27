import {APP_URL} from '../env.js';

/**
 * Origins allowed to call the API from a browser: the web app, plus API_CORS_ORIGIN (comma
 * separated). Used by CORS and by the widget's state-changing routes (#259, #271).
 */
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env, appUrl = APP_URL): string[] {
    const extra = (env.API_CORS_ORIGIN || '').split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean);
    return [...new Set([appUrl.replace(/\/$/, ''), ...extra])];
}

/**
 * A browser request sent from one of our pages. Browsers always send Origin on cross-site
 * POSTs: a form on another site cannot end or reset a visitor's session. Requests without
 * Origin (same-origin GETs, server-to-server) are left to the other checks.
 */
export function isSameSiteRequest(origin: unknown, allowed: string[] = allowedOrigins()): boolean {
    if (origin === undefined) return true;
    return typeof origin === 'string' && (allowed.includes('*') || allowed.includes(origin.replace(/\/$/, '')));
}
